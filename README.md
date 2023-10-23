# Tools
Scripts for tooling

## chimbozws_util.js
A small script that you can inject in your browser to inspect all incoming websockets, send packets with Chimboz format and automate tasks.

You can get current websocket instance by doing :
1. Open `DevTools`
2. `Memory` tab
3. Take a snapshot of the heap
4. Filter snapshot by `WebSockets`,
5. Right click on the WebSocket (often the first one you see that uses more heap) and `Store as global variable`
6. Inject the script (or if you already injected the script, `Chimboz.bind(temp1)`)

Your custom WebSocket instance with utils is `Chimboz`.

## swf2godot.py
### Requirements
```js
// Python
lxml==4.9.1
svgpathtools==1.5.1
numpy==1.23.5
rich==12.6.0
// Executables
ffdec>=16.0.0
rmlint
imagemagick // Optional; only if you use -s/--size option 
inkscape // Optional; only if you use -i/--inkscape option
```
### Usage
```
usage: swf2godot.py [-h] [--inkscape] [--zoom ZOOM] [--size SIZE] [--density DENSITY] [--ffdec FFDEC] [--debug] file [file ...]

export your Chapatiz room to a Godot equivalent

positional arguments:
  file                  targeted .swf file to convert

options:
  -h, --help            show this help message and exit
  --inkscape, -i        use inkscape export (slower but better)
  --zoom ZOOM, -z ZOOM  set resolution of assets (default: 4)
  --size SIZE, -s SIZE  set min width and height of assets to split in pixels; if size = 0, disable it (default: 0)
  --density DENSITY, -D DENSITY
                        set number of points used to approximate curves in collisions (default: 10)
  --ffdec FFDEC, -f FFDEC
                        specify ffdec executable path (default: ffdec)
  --debug, -d           print more logs and keep temporary generated files
```
## Warning
Some bugs still persist and I haven't found a solution but they are very special cases that you can fix manually:
1. special rooms like ban.swf that does not have a template_character node (they are not really rooms that user can access but with modified swf, take care that this template_character node is present)
2. speCollClip shapes that are rotated rectangles
  - collclip.svg at root output folder can help you compare
3. room duplicates are not strictly detected and removed
   - you can check them by opening them in Godot and compare visually or, more rigourously, use `diff` to check their differences
4. some elements does not have the correct z_index and are placed over others