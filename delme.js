

const ejs = require('ejs');
const fs = require('fs');
const path = require('path');


class S3G {
  constructor(src, dest, data) {
    this.dest = path.join(__dirname, 'build');
    this.src = path.join(__dirname, 'www');
    this.data = data;
    this.data._renderFile = this._renderFile;
    this._emptyDirectory(this.dest);
    fs.mkdirSync(this.dest);
    this.pageCount = 0;
    this.start = new Date().getTime();
  }


  parseFilesP(src = this.src, dest = this.dest) {
    const names = fs.readdirSync(src, {
      withFileTypes: true
    });

    names.map(name => {
      if (name.indexOf('_') === 0) {
        // Don't process files or directories starting with an underscore
        return;
      }

      const srcPathName = path.join(src, name);
      const destPathName = path.join(dest, name);

      if (fs.lstatSync(srcPathName).isDirectory()) {
        // Create a new subdirectory in the build folder
        fs.mkdirSync(destPathName)
        // Recurse the directory
        this.parseFilesP(
          srcPathName,
          destPathName,
          this.data
        );
      } else {
        // We parse .ejs template files, everything else is simply copied to dest
        if (path.extname(name).toLowerCase() === '.ejs') {
          const data = this.data;
          data.template = name;
          data.src = src;
          data.dest = dest;
          this._renderFile(data);
          this.pageCount++;
        } else {
          fs.copyFileSync(path.join(src, name), path.join(dest, name));
          this.pageCount++;
        }
      }
    });
    
  }

  /**
   *
   *
   * @static
   * @param {string} template
   * @param {object} data
   * @memberof S3G
   */
  _renderFile(data) {
    const _this=this;
    ejs.renderFile(path.join(data.src, data.template), data, {}, (err, str) => {
      if (!err) {
        
        let fileName = data.template.replace('.ejs', '.html');
        if (data.fileName) {
          fileName = data.fileName + '.html';
        }

        fs.writeFileSync(path.join(data.dest, fileName), str);
      } else {
        console.log(err);
      }
    });
  }


  /**
   *
   *
   * @static
   * @param {*} dirPath
   * @memberof S3G
   */
  _emptyDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).map(entry => {
        var entryPath = path.join(dirPath, entry);
        if (fs.lstatSync(entryPath).isDirectory()) {
          this._emptyDirectory(entryPath);
        } else {
          fs.unlinkSync(entryPath);
        }
      });
      fs.rmdirSync(dirPath);
    }
  }
}

// const iter = (srcDir, buildDir, names) => {
//   names.map(name => {
//     if (name.indexOf('_') === 0) {
//       // Don't process files or directories starting with an underscore
//       return;
//     }

//     const srcPathName = path.join(srcDir, name);
//     const destPathName = path.join(buildDir, name);

//     const s = fs.statSync(srcPathName);

//     if (s.isDirectory()) {
//       fs.mkdirSync(destPathName)
//       iter(
//         srcPathName,
//         destPathName,
//         fs.readdirSync(srcPathName, {
//           withFileTypes: true
//         })
//       );
//     } else {
//       if (path.extname(srcPathName).toLowerCase() === '.ejs') {
//         const data = {
//           makeFile: (template, data) => {
//             ejs.renderFile(path.join(srcDir, template), data, options, (err, str) => {
//               if (!err) {
//                 ++pageCount;
//                 fs.writeFileSync(path.join(buildDir, new Date().toISOString()), str);
//                 console.log('templateing');
//               } else {
//                 console.log(err);
//               }
//             });
//           },


//           products: [{
//               slug: 'slug1',
//               thumbnailUrl: 'thumbnailUrl',
//               teaser: 'teaser',
//               title: 'prod one'
//             },
//             {
//               slug: 'slug2',
//               thumbnailUrl: 'thumbnailUrl',
//               teaser: 'teaser',
//               title: 'prod two'
//             }, {
//               slug: 'slug3',
//               thumbnailUrl: 'thumbnailUrl',
//               teaser: 'teaser',
//               title: 'prod three'
//             }
//           ]
//         }
//         const options = {}
//         ejs.renderFile(srcPathName, data, options, (err, str) => {
//           if (!err) {
//             ++pageCount;
//             fs.writeFileSync(path.join(destPathName), str);
//             console.log(path.join(destPathName));
//           } else {
//             console.log(err);
//           }
//         });
//       }

//     }
//   })

// }

const data = {
  products: [{
      slug: 'slug1',
      thumbnailUrl: 'thumbnailUrl',
      teaser: 'teaser',
      title: 'prod one'
    },
    {
      slug: 'slug2',
      thumbnailUrl: 'thumbnailUrl',
      teaser: 'teaser',
      title: 'prod two'
    }, {
      slug: 'slug3',
      thumbnailUrl: 'thumbnailUrl',
      teaser: 'teaser',
      title: 'prod three'
    }
  ]
}

// function rimraf(dir_path) {
//   if (fs.existsSync(dir_path)) {
//     fs.readdirSync(dir_path).forEach(function (entry) {
//       var entry_path = path.join(dir_path, entry);
//       if (fs.lstatSync(entry_path).isDirectory()) {
//         rimraf(entry_path);
//       } else {
//         fs.unlinkSync(entry_path);
//       }
//     });
//     fs.rmdirSync(dir_path);
//   }
// }

const s3G = new S3G(path.join(__dirname, 'www'), path.join(__dirname, 'build'), data);
s3G.parseFilesP();
console.log(`processed ${s3G.pageCount} pages in ${new Date().getTime() - s3G.start}ms`)
