# Icon Fonts

The original W3Schools theme used the full Font Awesome set consisting of several hundred SVG icons. It supported everything 
*except* Docker. [Fontello](http://fontello.com/) was used to import only the required Font Awesome fonts plus one Docker 
SVG font creted by [Wes Bos](https://github.com/wesbos/Font-Awesome-Docker-Icon). Fontello settings were used to retain
the "fa-" prefix to make it simple to integrate the new icon font into the existing theme.

The font-awesome.* fonts have been removed as has css/font-awesome.css. Note that Font Awesome CSS provides a lot of helper
classes for displaying icons inline, stacking, animating and transforming. If these features are needed then the classes
could be copied from font-awesome.css. Font-awesome.css also includes the several hundred unicode definitions which 
contribute significantly to the size of the css file. 

If further customization is needed go to [http://fontello.com](http://fontello.com), click the spanner icon and choose to 
import the fonts/icon.json file.

