var rpt = require('read-package-tree');
var path = require('path');
var fs = require('fs-extra');
var glob = require('glob');

var seen = {};

function extractNode(data) {
  data.children.forEach(function (child) {
    extractNode(child);
  });

  if (seen[data.package.name]) {
    return;
  }
  seen[data.package.name] = true;
  var jlab = data.package.jupyterlab;
  if (!jlab) {
    return;
  }

  // Handle schemas.
  var schemaDir = jlab['schemaDir'];
  if (schemaDir) {
    const from = path.join(data.realpath, schemaDir);
    const to = path.join(schemaDest, data.package.name);
    fs.copySync(from, to);
  }

  // Handle themes.
  var themeDir = jlab['themeDir'];
  if (themeDir) {
    var themeName = data.package.name;
    const from = path.join(data.realpath, themeDir);
    const to = path.join(themesDest, themeName);
    fs.copySync(from, to);

    /**
     * Change relative paths. This is done at runtime by jupyterlab_launcher.
     * A similar solution needs to be used when themes are dynamically loaded.
     *
     * See https://github.com/jupyterlab/jupyterlab_launcher/blob/v0.10.3/jupyterlab_launcher/themes_handler.py
     */
    glob.sync(path.join(to, '**/*.css')).forEach(file => {
      fs.readFile(file, 'utf8', function (err, data) {
        if (err) {
          return console.log(err);
        }

        var result = data.replace(
          /url\('([^/].*)'\)|url\("([^/].*)"\)/gi,
          "url('../../themes/" + themeName + "/$1')"
        );
        fs.writeFile(file, result, 'utf8', function (err) {
          if (err) return console.log(err);
        });
      });
    });
  }
}

rpt('.', function (er, data) {
  extractNode(data);
});
