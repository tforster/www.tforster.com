"use strict";
module.exports = function (grunt) {
   grunt.initConfig({
      pkg: grunt.file.readJSON("package.json"),
      uglify: {
         options: {
            beautify: false,
            report: "min",
            banner: "/*(c) 2014, Troy Forster. Generated on <%= grunt.template.today(\"yyyy-mm-dd\") %> */\n",
            sourceMap: true
         },

         build: {
            options: {
               sourceMapName: "public/scripts/main.min.js.map"            
            },
            files: [
               {
                  src: [
                     "browser-source/scripts/waypoints.js",
                     "browser-source/scripts/jquery.knob.js",
                     "browser-source/scripts/jquery.easing.1.3.js",
                     "browser-source/scripts/bootstrap.js",
                     "browser-source/scripts/main.js",
                     "browser-source/scripts/ga.js"
                  ],
                  dest: "public/scripts/main.min.js"
               }
            ]
         }
      },

      cssmin: {
         add_banner: {
            options: {
               banner: "/*(c) 2014, Troy Forster. Generated on <%= grunt.template.today(\"yyyy-mm-dd\") %> */\n",
            },
            files: [
               {
                  src: [
                     "browser-source/stylesheets/bootstrap.css",
                     "browser-source/stylesheets/bootstrap-responsive.css",
                     "browser-source/stylesheets/font-awesome.css",
                     "browser-source/stylesheets/style.css"
                  ],
                  dest: "public/stylesheets/main.min.css"
               }
            ]
         }
      },

      // Appends an MD5 hash as a querystring param
      cachebreaker: {
         //dev: {
            options: {
               match: ["main.min.js", "main.min.css"],
               replacement: "md5",
               src: {
                  path: "views/index.html"
               }
            },
            files: {
               src: ["views/index.html"]
            }
         //}
      },

      watch: {
         options: {
            dateFormat: function (time) {
               grunt.log.writeln("The watch finished in " + time + "ms at " + (new Date()).toString());
               grunt.log.writeln("Waiting for more changes...");
            }
         },
         js: {
            files: "browser-source/scripts/*.js",
            tasks: ["uglify"],
            options: {
               spawn:false
            }
         },
         css: {
            files: "browser-source/stylesheets/*.css",
            tasks: ["cssmin"],
            options: {
               spawn: false
            }
         },
         cachebust: {
            files: "scripts/main.min.js",
            tasks: ["cachebreaker"],
            options: {
               spawn: false
            }
         }
      }
   });

   grunt.loadNpmTasks("grunt-contrib-uglify");
   grunt.loadNpmTasks("grunt-contrib-cssmin");
   grunt.loadNpmTasks("grunt-contrib-watch");
   grunt.loadNpmTasks("grunt-cache-breaker");
   grunt.registerTask("default", "watch");
};