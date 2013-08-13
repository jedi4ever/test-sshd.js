module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      // define the files to lint

      web: {
        files: {
          //src: ['public/js/*.js']
        },
        options: {
          browser: true,
          devel: true,
          strict: true,
          jquery: true,
          unused: true,
          trailing: true,
          undef: true
        }
      },
      lib: {
        files: {
          src: ['lib/**/*.js']
        },
        options: {
          node: true,
          curly: true,
          quotmark: 'single',
          //unused: true,
          trailing: true,
          strict: true,
          undef: true
        }
      },
      test: {
        files: {
          src: ['test/**/*.js']
        },
        options: {
          node: true,
          curly: true,
          quotmark: 'single',
          undef: false,
          trailing: true,
          //strict: true
        }
      },
      gruntfile: {
        files: {
          src: ['Gruntfile.js']
        }
      },
    },
    // Configure a mochaTest task
    mochaTest: {
      test: {
        options: {
          reporter: 'list',
          require: 'coverage/blanket'
        },
        src: ['test/**/*.js']
      },
      coverage: {
        options: {
          reporter: 'html-cov',
          // use the quiet flag to suppress the mocha console output
          quiet: true
        },
        src: ['test/**/*.js'],
        // specify a destination file to capture the mocha
        // output (the quiet option does not suppress this)
        dest: 'coverage.html'
      }
    },

    watch: {
      gruntfile: {
        files: 'Gruntfile.js' ,
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: ['lib/**/*.js','bin/*','test/**/*.js'],
        tasks: ['test']
      },
      web: {
        files: ['public/js/*.js'],
        tasks: ['test']
      },
      options: {
        nospawn: false
      }
    },
    docco: {
      docs: {
        src: ['lib/**/*.js'],
        options: {
          output: 'docs/annotated-source'
        }
      }
    },
    htmllint: {
        all: ["public/index.html"]
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-release');
  grunt.loadNpmTasks('grunt-docco2');
  grunt.loadNpmTasks('grunt-html');

  grunt.registerTask('test', ['jshint','mochaTest']);

  // Default task(s).
  grunt.registerTask('default', ['jshint']);

};
