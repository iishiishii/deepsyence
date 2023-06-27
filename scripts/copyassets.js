const path = require('path');
const fs = require('fs-extra');
const watch = require('node-watch');


const buildDir = path.resolve('./build');
const srcDir = path.resolve('./src');

function walkSync(currentDirPath, callback) {
  fs.readdirSync(currentDirPath).forEach(name => {
    const filePath = path.join(currentDirPath, name);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      callback(filePath, stat);
    } else if (stat.isDirectory()) {
      walkSync(filePath, callback);
    }
  });
}

/**
 * Copy assets into build dir so they can be resolved.
 */
function copyAssests() {
  process.stdout.write('Copying assets into build directory...');
  if (!fs.existsSync(srcDir)) {
    console.error('jupyterlab-desktop build: could not find source directory.');
    process.exit();
  }

  const dest = path.resolve(path.join(buildDir));
  if (!fs.existsSync(dest)) {
    console.error('jupyterlab-desktop build: could not find target directory.');
    process.exit();
  }

  // Copy style and img directories into build directory
  walkSync(srcDir, srcPath => {
    const destPath = srcPath.replace(srcDir, dest);

    if (srcPath.includes('style') || srcPath.includes('img')) {
      fs.copySync(srcPath, destPath);
    }
  });


  fs.copySync(
    path.join(srcDir, 'app', 'index.html'),
    path.join(dest, 'index.html')
  );


  console.log('done');
}
copyAssests();

if (process.argv.length > 2 && process.argv[2] == 'watch') {
  watch(srcDir, { recursive: true }, function (evt, name) {
    if (/(\.css$)|(\.html$)/.test(name)) {
      console.log('Asset chage detected.');
      copyAssests();
    }
  });
}
