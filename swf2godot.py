#! /usr/bin/env python3

try:
    import signal # Handle signals
    import argparse # Arg parser
    from pathlib import Path # Type for file arg
    import os # OS utilities
    import shutil # File management utilities
    from lxml import etree # XML utilities
    import subprocess # Execute shell commands
    import re # Regex
    from glob import glob # Expand regex globs
    import svgpathtools # SVG utilities
    import numpy # Math library
    from math import ceil
    from rich.progress import Progress, SpinnerColumn, TimeElapsedColumn, TextColumn # Interface
except ImportError as e:
    print(f"""\033[91m\033[1m❌ Error:\033[22m {e}
Please install it \033[2m(pip install package)""")
    exit(1)

with Progress(
    SpinnerColumn(),
    TextColumn("{task.completed}/{task.total}"),
    *Progress.get_default_columns(),
    TimeElapsedColumn(),
    transient=False) as progress:

    class shell:
        """shell utilities"""
        def cmd(string: str, open=False):
            """execute a simple shell command and communicating output"""
            process = subprocess.Popen(
                string.split(),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            if not open: process.communicate()
            return process

        def setup(name: str):
            """set up output folders"""
            os.makedirs(f"output_{name}/{name}/scripts", exist_ok=True)
            os.makedirs(f"output_{name}/tmp", exist_ok=True)
            os.makedirs(f"output_{name}/rooms", exist_ok=True)
            os.makedirs(f"output_{name}/{name}/objects", exist_ok=True)
            os.makedirs(f"output_{name}/{name}/sprites", exist_ok=True)
        
        def move_all_files(src: str, asset: str, width: float, height: float):
            """move all generated assets to godot sprites folder"""
            try:
                if args.size != 0 and args.type == 'png':
                    shell.cmd(f"convert output_{src}/tmp/shapes/{asset}.{args.type} -crop {args.size}x{args.size} output_{src}/{src}/sprites/{asset}_%d.{args.type}")
                    godot.split.importfile(src, asset, width, height)
                else:
                    shutil.move(f"output_{src}/tmp/shapes/{asset}.{args.type}", f"output_{src}/{src}/sprites/{asset}.{args.type}")
                    godot.importfile(src, asset, width, height)
            except: pass
            try:
                folder = glob(f"output_{src}/tmp/sprites/DefineSprite_{asset}*")[0]
                frame_list = shell.dedupe(f"output_{src}/tmp/sprites", len(os.listdir(folder)))
                files = os.listdir(folder)
            except: return
            if len(files) == 1:
                if args.size != 0 and args.type == 'png':
                    shell.cmd(f"convert '{folder}/1.{args.type}' -crop {args.size}x{args.size} output_{src}/{src}/sprites/{asset}_%d.{args.type}")
                    godot.split.importfile(src, asset, width, height)
                else:
                    shutil.move(f"{folder}/1.{args.type}", f"output_{src}/{src}/sprites/{asset}.{args.type}")
                    godot.importfile(src, asset, width, height)
                return
            os.makedirs(f"output_{src}/{src}/sprites/{asset}", exist_ok=True)
            for file in files:
                if args.size != 0 and args.type == 'png':
                    shell.cmd(f"convert '{folder}/{file}' -crop {args.size}x{args.size} output_{src}/{src}/sprites/{asset}/{file[:-4]}_%d.{args.type}")
                else:
                    shutil.move(f"{folder}/{file}", f"output_{src}/{src}/sprites/{asset}")
            if args.size != 0: godot.split.importanimation(src, asset, frame_list, width, height)
            else: godot.importanimation(src, asset, frame_list, width, height)
            global warning
            if len(files) > warning: warning = len(files)
        
        def dedupe(path: str, frames: int):
            shell.cmd(f"rmlint {path}")
            frame_list = []
            for frame in range(frames):
                original = frame + 1
                try:
                    match = subprocess.run(["grep", f"/{frame + 1}.{args.type}' '", "rmlint.sh"], stdout=subprocess.PIPE).stdout.decode()
                    original = int(re.search(f"/([0-9]+).{args.type}' # duplicate", match).group(1))
                except: pass
                # if frame is duplicate
                if original != frame + 1:
                    # if duplicate of previous frame, increment previous frame timer
                    if frame_list[len(frame_list) - 1][0] == original:
                        frame_list[len(frame_list) - 1][1] += 1
                    # else push original frame name with count 0
                    else: frame_list.append([original,0])
                # else frame is not duplicate push it with count 0
                else: frame_list.append([original,0])

            if frame_list[0][0] == frame_list[len(frame_list) - 1][0]:
                frame_list[0][1] += frame_list[len(frame_list) - 1][1]
                frame_list.pop()

            shell.cmd("./rmlint.sh -d")
            return frame_list

        # Exporting a targeted sprite
        def ffdec(file: str, asset_id: str):
            """export targeted asset as an image with ffdec"""
            return shell.cmd(f"{args.ffdec} -cli -format shape:{args.type},sprite:{args.type} -zoom {args.zoom if args.type == 'png' else 1} -selectid {asset_id} -export shape,sprite output_{file}/tmp {file}.swf", open=True)

    class xml:
        """xml utilities"""
        def scene(file: str):
            """main scene node"""
            return etree.parse(f"output_{file}/tmp/{file}.xml").xpath("/swf/tags/item/subTags/item[@name='template_character']")[0].getparent().getparent()

        # SVG model
        def svg_scene(file: str, frame=1):
            """svg scene of frame node"""
            return etree.parse(f"output_{file}/tmp/model/{frame}.svg").getroot()[0]

        def collclip(file: str):
            """collclip node"""
            return etree.parse(f"output_{file}/tmp/{file}.xml").xpath("/swf/tags/item[@name='collclip']")[0]

        def specollclip(file: str):
            """specollclip node"""
            return etree.parse(f"output_{file}/tmp/{file}.xml").xpath("/swf/tags/item[@name='speCollClip']")[0]

        def values(el: etree.ElementBase):
            """return scale, position and size values of an element"""
            return tuple(float(value) for value in re.search(r"matrix\((.*), .*, .*, (.*), (.*), (.*)\) (.*) (.*)", f"{el.get('transform')} {el.get('width')} {el.get('height')}").groups())

        def values_(el: etree.ElementBase):
            """return scale, position and size values of an element"""
            return tuple(float(value) for value in re.search(r"matrix\((.*), .*, .*, (.*), (.*), (.*)\)", el.get('transform')).groups())

        def calc_tuples(base: tuple, new: tuple):
            return (base[0] * new[0], base[1] * new[1], base[2] + new[2], base[3] + new[3])

        def frame(file: str, frame=0):
            list = []
            count = 0
            for element in xml.scene(file)[0]:
                if(element.get("type") == "ShowFrameTag"): count += 1
                if count <= frame:
                    if element.get("type") == "PlaceObject2Tag":
                        for removed in [x for x in list if x.get("depth") == element.get("depth")]:
                            list.remove(removed)
                        list.append(element)
                    if element.get("type") == "RemoveObject2Tag":
                        for removed in [x for x in list if x.get("depth") == element.get("depth")]:
                            list.remove(removed)
                else: break
            return list

    class svg:
        """path utilities"""
        def arc_to_points(arc, density=10):
            """transform svg curves to point"""
            points = ""
            for step in range(density - 1):
                points += f"{numpy.real(arc.point(step/density))},{numpy.imag(arc.point(step/density))},"
            return points
        
        def path_to_vector(path: str):
            """transform svg path to a godot vector"""
            path = svgpathtools.parse_path(path)
            vector_split = ""
            vectors = []
            constructed_path = svgpathtools.Path()
            for element in path:
                if type(element) == svgpathtools.Line:
                    vector_split += f"{numpy.real(element.point(0))},{numpy.imag(element.point(0))},"
                else: vector_split += svg.arc_to_points(element, args.density)
                constructed_path.append(element)
                if constructed_path.isclosed():
                    vector_split += f"{numpy.real(element.point(1))},{numpy.imag(element.point(1))}"
                    vectors.append(vector_split)
                    vector_split = ""
                    constructed_path = svgpathtools.Path()
            return vectors

    class godot:
        """godot utilities"""
        def importfile(file: str, asset: str, width: float, height: float):
            """create a scene file for asset"""
            f = open(f"output_{file}/{file}/objects/{asset}.tscn","w")
            f.write(f"""[gd_scene load_steps=1 format=2]
[ext_resource path="res://output_{file}/{file}/sprites/{asset}.{args.type}" type="Texture" id=1]
[node name="{asset}" type="Node2D"]
[node name="Sprite" type="Sprite" parent="."]
use_parent_material = true
texture = ExtResource( 1 )
position = Vector2( {width / 2}, {height / 2} )
scale = Vector2( {1 / args.zoom}, {1 / args.zoom} )""")
            f.close()
        
        def importanimation(file: str, asset: str, frames: list, width: float, height: float):
            """create a scene file for animated asset"""
            resources = ""
            frame_textures = ""
            for index, frame in enumerate(frames):
                resources += f'[ext_resource path="res://output_{file}/{file}/sprites/{asset}/{frame[0]}.{args.type}" type="Texture" id={index + 1}]\n'
                frame_textures += f'frame_{index}/texture = ExtResource( {index + 1} )\nframe_{index}/delay_sec = {frame[1] / framerate}\n'
            f = open(f"output_{file}/{file}/objects/{asset}.tscn","w")
            f.write(f"""[gd_scene load_steps=1 format=2]
{resources}
[sub_resource type="AnimatedTexture" id=1]
frames = {len(frames)}
fps = {framerate}
{frame_textures}
[node name="{asset}" type="Node2D"]
[node name="Sprite" type="Sprite" parent="."]
use_parent_material = true
texture = SubResource( 1 )
position = Vector2( {width / 2}, {height / 2} )
scale = Vector2( {1 / args.zoom}, {1 / args.zoom} )""")
            f.close()

        class split:
            """special functions for splitted assets"""
            def importfile(file: str, asset: str, width: float, height: float):
                """create a scene file for asset (taking account splitted files)"""
                col = ceil(width * args.zoom / args.size)
                row = ceil(height * args.zoom / args.size)
                resources = ""
                nodes = ""
                chunk = args.size / args.zoom
                for index in range(col * row):
                    resources+= f'[ext_resource path="res://output_{file}/{file}/sprites/{asset}_{index}.{args.type}" type="Texture" id={index + 1}]\n'
                    nodes += f"""[node name="Sprite_{index}" type="Sprite" parent="."]
use_parent_material = true
texture = ExtResource( {index + 1} )
position = Vector2( {(index % col) * chunk +  (chunk if (index + 1) % col else width % chunk)  / 2}, {int(index / col) * chunk + (chunk if ceil((index + 1) / col) != row else height % chunk)  / 2} )
scale = Vector2( {1 / args.zoom}, {1 / args.zoom} )\n"""

                f = open(f"output_{file}/{file}/objects/{asset}.tscn","w")
                f.write(f"""[gd_scene load_steps=1 format=2]
{resources}
[node name="{asset}" type="Node2D"]
{nodes}""")
                f.close()
            
            def importanimation(file: str, asset: str, frames: list, width: float, height: float):
                """create a scene file for animated asset (taking account splitted files)"""
                col = ceil(width * args.zoom / args.size)
                row = ceil(height * args.zoom / args.size)
                resources = [''] * col * row
                frame_textures = [''] * col * row
                id = 1
                for index_frame, frame in enumerate(frames):
                    for index_col in range(col):
                        for index_row in range(row):
                            index = index_col + index_row * col
                            resources[index] += f'[ext_resource path="res://output_{file}/{file}/sprites/{asset}/{frame[0]}_{index}.{args.type}" type="Texture" id={id}]\n'
                            frame_textures[index] += f'frame_{index_frame}/texture = ExtResource( {id} )\nframe_{index_frame}/delay_sec = {frame[1] / framerate}\n'
                            id += 1

                chunk = args.size / args.zoom
                sub_resources = ""
                nodes = ""
                for index, frame_texture in enumerate(frame_textures):
                    sub_resources += f"""[sub_resource type="AnimatedTexture" id={index + 1}]
frames = {len(frames)}
fps = {framerate}
{frame_texture}\n"""
                    nodes += f"""[node name="Sprite_{index}" type="Sprite" parent="."]
use_parent_material = true
texture = SubResource( {index + 1} )
position = Vector2( {(index % col) * chunk +  (chunk if (index + 1) % col else width % chunk)  / 2}, {int(index / col) * chunk + (chunk if ceil((index + 1) / col) != row else height % chunk)  / 2} )
scale = Vector2( {1 / args.zoom}, {1 / args.zoom} )\n"""

                join_resources = "\n".join(resources)
                f = open(f"output_{file}/{file}/objects/{asset}.tscn","w")
                f.write(f"""[gd_scene load_steps=1 format=2]
{join_resources}
{sub_resources}
[node name="{asset}" type="Node2D"]
{nodes}""")
                f.close()

        # Frame exporter
        def frame(file: str, frame: int, whitelist: dict, xml_frame: list):
            """iterate on each elements of a frame and convert them to godot files"""
            # TODO: change colors of assets
            # scene = xml.scene(file)
            svg_scene = xml.svg_scene(file, frame)
            frame_task = progress.add_task(f"[blue][b]\[{file}][/b] :package: Exporting assets", total=len(svg_scene))

            tscn_imports = ""
            tscn_elements = ""
            tscn_filters = ""

            local_whitelist = dict()
            filter_whitelist = dict()
            for index, element in enumerate(svg_scene):
                if xml.values(element)[4] == 0 or xml.values(element)[5] == 0:
                    progress.log(f"[yellow]⚠️  Skipping invisible element {element.get('data-characterId')}")
                    continue
                if not (element.get("data-characterId") in whitelist):
                    export_task = progress.add_task(f"[green][b]\[{file}][/b] :page_facing_up: Element {element.get('data-characterId')}", total=1, start=False)
                    progress.log(f"[green]✨ Exporting new element {element.get('data-characterId')} to {args.type.upper()}")
                    export = shell.ffdec(file, element.get("data-characterId"))
                    for line in iter(export.stdout.readline, b''):
                        match = re.search(r"Exported frame (.*)/(.*) DefineSprite", line.decode())
                        if match:
                            progress.start_task(export_task)
                            progress.update(export_task, completed=int(match.group(1)), total=int(match.group(2)))
                    export.wait()
                    progress.update(export_task, visible=False)
                    shell.move_all_files(file, element.get("data-characterId"), xml.values(element)[4], xml.values(element)[5])
                    whitelist[element.get("data-characterId")] = len(whitelist) + index + 3
                    if args.debug: progress.log(f"[magenta]:bug: Whitelist {whitelist}")
                if not (element.get("data-characterId") in local_whitelist):
                    local_whitelist[element.get("data-characterId")] = whitelist[element.get("data-characterId")]
                    tscn_imports += f'[ext_resource path="res://output_{file}/{file}/objects/{element.get("data-characterId")}.tscn" type="PackedScene" id={whitelist[element.get("data-characterId")]}]\n'
                    if args.debug: progress.log(f"[magenta]:bug: Local whitelist {local_whitelist}")
                if args.debug: progress.log(f"[magenta]:bug: #{index} Element {index} [dim]{{ scaleX: {xml.values(element)[0]}, scaleY: {xml.values(element)[1]}, x: {xml.values(element)[2]}, y: {xml.values(element)[3]}, width: {xml.values(element)[4]}, height: {xml.values(element)[5]} }}")
                        
                tscn_elements += f"""[node name="{file}_{index}" parent="Decor" instance=ExtResource( {whitelist[element.get("data-characterId")]} )]
position = Vector2( {xml.values(element)[2]}, {xml.values(element)[3]} )
scale = Vector2( {xml.values(element)[0]}, {xml.values(element)[1]} )
z_index = {index + 1}"""
                
                match = [x for x in xml_frame if x.get("characterId") == element.get("data-characterId")]
                if len(match):
                    match = match[0]
                    xml_frame.remove(match)
                    filter = match.find("colorTransform")
                    if filter is not None:
                        key = f"{filter.get('redAddTerm')},{filter.get('greenAddTerm')}, {filter.get('blueAddTerm')},{filter.get('alphaAddTerm')},{filter.get('redMultTerm')},{filter.get('greenMultTerm')}, {filter.get('blueMultTerm')},{filter.get('alphaMultTerm')}"
                        if not key in filter_whitelist:
                            filter_whitelist[key] = index
                            tscn_filters += f"""[sub_resource type="ShaderMaterial" id={index}]
shader = ExtResource( 2 )
shader_param/add = Color( {int(filter.get("redAddTerm")) / 256}, {int(filter.get("greenAddTerm")) / 256}, {int(filter.get("blueAddTerm")) / 256}, {int(filter.get("alphaAddTerm")) / 256} )
shader_param/multiply = Color( {int(filter.get("redMultTerm")) / 256}, {int(filter.get("greenMultTerm")) / 256}, {int(filter.get("blueMultTerm")) / 256}, {int(filter.get("alphaMultTerm")) / 256} )\n\n"""
                        tscn_elements += f"\nmaterial = SubResource( {filter_whitelist[key]} )"

                tscn_elements += "\n\n"
                progress.advance(frame_task)
            
            f = open(f"output_{file}/rooms/{file}_{frame}.tscn", "w")
            f.write(f"""[gd_scene load_steps=1 format=2]

[ext_resource path="res://output_{file}/{file}/scripts/{file}.gd" type="Script" id=1]
[ext_resource path="res://output_{file}/{file}/muladd.gdshader" type="Shader" id=2]
{tscn_imports}

{tscn_filters}

[node name="World" type="YSort"]
script = ExtResource( 1 )

[node name="Players" type="YSort" parent="."]
z_index = 1

[node name="Decor" type="YSort" parent="."]
__meta__ = {{ "_edit_lock_": true }}

{tscn_elements}""")
            f.close()
            progress.update(frame_task, visible=False)
            return whitelist

        # Main exporter
        def scene(name: str, parent: etree.ElementBase):
            """iterate on each frames of a scene and convert them to godot files"""
            # Intensive exports first
            progress.log(f"[blue]🖼️  Exporting model to SVG")
            process = shell.cmd(f"{args.ffdec} -cli -format shape:svg,sprite:svg -zoom {args.zoom if args.type == 'png' else 1} -select 1 -selectid {parent.get('spriteId')} -export shape,sprite output_{name}/tmp {name}.swf")
            process.wait()
            shutil.move(f"output_{name}/tmp/sprites/DefineSprite_{parent.get('spriteId')}", f"output_{name}/tmp/model")

            progress.start_task(main_task)
            progress.update(main_task, total=(int(parent.get('frameCount')) + 2))
            whitelist = dict()
            for frame in range(int(parent.get('frameCount'))):
                progress.log(f"[blue]🎞️  Frame {frame}")
                whitelist = godot.frame(name, frame + 1, whitelist, xml.frame(name, frame))
                progress.advance(main_task)

            f = open(f"output_{name}/{name}/scripts/{name}.gd", "w")
            f.write(f"""extends YSort
var droppedItems = []
export var roomName = ""
func _ready():
    Global.sendRoomReady()""")
            f.close()

            f = open(f"output_{name}/{name}/muladd.gdshader", "w")
            f.write(f"""shader_type canvas_item;

uniform vec4 add :hint_color = vec4(0,0,0,0);
uniform vec4 multiply :hint_color = vec4(1,1,1,1);

void fragment(){{
	vec4 base = texture(TEXTURE,UV);
	COLOR = vec4(base.r * multiply.r + add.r, base.g * multiply.g + add.g, base.b * multiply.b + add.b, base.a * multiply.a + add.a);
}}""")
            f.close()
        
        def collclip(file: str, frames: int, collclip: str):
            """export collclip as a godot equivalent"""
            progress.log(f"[blue]:construction: Exporting {collclip}")

            scene = etree.parse(f"output_{file}/tmp/1.svg").getroot()

            element = scene.find(f".//*[@id='{collclip}']")

            collclips_tscn = ""

            xlink_href = "{http://www.w3.org/1999/xlink}href"

            paths = scene.find(f".//*[@id='{element.get(xlink_href)[1:]}']")
            for index_1, path in enumerate(paths):
                progress.log(f"[green]✨ Exporting new path")
                values = (1.0, 1.0, 0.0, 0.0)
                while path.get("d") == None:
                    values = xml.calc_tuples(values, xml.values_(path))
                    if path.tag == "{http://www.w3.org/2000/svg}use":
                        path = scene.find(f".//*[@id='{path.get(xlink_href)[1:]}']")
                    elif path.tag == "{http://www.w3.org/2000/svg}g": path = path[0]
                for index_2, vectors in enumerate(svg.path_to_vector(path.get("d"))):
                        collclips_tscn += f"""[node name="{collclip}_{index_1}_{index_2}" type="CollisionPolygon2D" parent="Decor/{collclip}"]
build_mode = 1
position = Vector2( {values[2]}, {values[3]} )
scale = Vector2( {values[0]}, {values[1]} )
polygon = PoolVector2Array( {vectors} )\n\n"""

            for frame in range(frames):
                f = open(f"output_{file}/rooms/{file}_{frame + 1}.tscn", "a")
                f.write(f"""[node name="{collclip}" type="StaticBody2D" parent="Decor"]
z_index = 4096

{collclips_tscn}""")
                f.close()
            progress.advance(main_task)

    def density_type(arg):
        """type for density argument"""
        try: f = int(arg)
        except ValueError: raise argparse.ArgumentTypeError(f"invalid int value: '{arg}'")
        if f < 2: raise argparse.ArgumentTypeError("density must be > 1")
        return f

    def parser():
        """argument parser"""
        parser = argparse.ArgumentParser(description="export your Chapatiz room to a Godot equivalent")
        parser.add_argument(
            "file",
            metavar="file",
            type=Path,
            nargs="+",
            help="targeted .swf file to convert")
        parser.add_argument(
            "--svg",
            "-v",
            dest="type",
            action="store_const",
            const="svg",
            default="png",
            help="export assets as svg (default: png)")
        parser.add_argument(
            "--zoom",
            "-z",
            dest="zoom",
            type=float,
            default=4,
            help="set resolution of assets (default: 4); if --svg is used, assets are exported at zoom 1 but zoom is used to downscale them in godot")
        parser.add_argument(
            "--size",
            "-s",
            dest="size",
            type=int,
            default=0,
            help="set min width and height of assets to split in pixels; if size = 0, disable it (default: 0)")
        parser.add_argument(
            "--density",
            "-D",
            dest="density",
            type=density_type,
            default=10,
            help="set number of points used to approximate curves in collisions (default: 10)")
        parser.add_argument(
            "--ffdec",
            "-f",
            dest="ffdec",
            default="ffdec",
            help="specify ffdec executable path (default: ffdec)")
        parser.add_argument(
            "--debug",
            "-d",
            dest="debug",
            action="store_true",
            help="print more logs and keep temporary generated files")
        return parser

    def signal_handler(sig, frame):
        """custom handler for kill signal"""
        progress.log("[red b]:stop_sign: swf2godot aborted by user")
        exit(0)

    def main():
        """main program"""
        signal.signal(signal.SIGINT, signal_handler)

        progress.log(f"[blue b]:robot: swf2godot")

        global args
        args = parser().parse_args()
        if args.debug: progress.log(f"[magenta]:bug: Command arguments {args}")

        # Check programs are installed
        try: shell.cmd(f"{args.ffdec} --help")
        except:
            progress.log("[red][b]:cross_mark: Error:[/b] ffdec not found")
            exit(1)
        try: shell.cmd(f"rmlint --version")
        except:
            progress.log("[red][b]:cross_mark: Error:[/b] rmlint not found")
            exit(1)
        if args.size != 0:
            try: shell.cmd(f"convert -version")
            except:
                progress.log("[red][b]:cross_mark: Error:[/b] convert not found (imagemagick package)")
                exit(1)

        for file in args.file:
            if not file.exists():
                progress.log(f"[red][b]:cross_mark: Error:[/b] {file} does not exist")
                continue
            if file.suffix != '.swf':
                progress.log(f"[red][b]:cross_mark: Error:[/b] {file} is not a swf")
                continue

            global main_task
            main_task = progress.add_task(f"[blue][b]\[{file.stem}] :robot: Exporting scene", total=1, start=False)

            global warning
            warning = 0

            shutil.rmtree(f"output_{file.stem}", ignore_errors=True)

            progress.log(f"[blue b]⚙️  Converting {file} [dim](:magnifying_glass_tilted_left: zoom: {args.zoom}) output: output_{file.stem}")
            shell.setup(file.stem)

            progress.log(f"[blue]:dna: Exporting XML structure")
            shell.cmd(f"{args.ffdec} -cli -swf2xml {file.stem}.swf output_{file.stem}/tmp/{file.stem}.xml")
            global framerate
            framerate = float(etree.parse(f"output_{file.stem}/tmp/{file.stem}.xml").getroot().get("frameRate"))
            scene = xml.scene(file.stem)
            progress.log(f"[blue b]:robot: Creating Godot scene [dim](id: {scene.get('spriteId')})")
            godot.scene(file.stem, scene)
            shell.cmd(f"{args.ffdec} -cli -format frame:svg -zoom 1 -export frame output_{file.stem}/tmp {file.stem}.swf")
            godot.collclip(file.stem, int(scene.get('frameCount')), "collclip")
            godot.collclip(file.stem, int(scene.get('frameCount')), "speCollClip")
            shell.cmd(f"rmlint output_{file.stem}/rooms")
            shell.cmd("./rmlint.sh -d")

            shutil.move(f"output_{file.stem}/tmp/1.svg", f"output_{file.stem}/collclip.svg")
            if not args.debug: shutil.rmtree(f"output_{file.stem}/tmp")

            progress.log(f"[green b]:white_check_mark: {file} successfully converted")
            if warning > 100: progress.log(f"[yellow][b]⚠️  Warning:[/b] one asset has {warning} frames and could crash Godot, try importing it without this asset")

    # Main execution as a script
    if __name__ == "__main__":
        main()
