var request = require('request');
var db = require('./database');
var slack = require('./slack');
var _ = require('underscore');
var config = require('./config');

module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      bower: {
        options: {
          compress: true
        },
        files: {
          'public/js/vendor/compiled.min.js': 'public/js/vendor/compiled.js'
        }
      }
    },
    bower_concat: {
      all: {
        dest: 'public/js/vendor/compiled.js',
        cssDest: 'public/css/vendor/compiled.css',
      }
    }
  });
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-bower-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('default', ['bower_concat', 'uglify:bower']);
  grunt.registerTask('chooser', 'Chooses the lunch destination for this week', function () {
    var done = this.async();

    db.getVotes(function (votes) {
      var choices;
      if (votes.length === 0) {
        grunt.log.fail("No votes!");
        done();
        return
      } else {
        var index = Math.floor(Math.random() * votes.length);
        
        var choiceid = votes[index].vote;
        var choice = _.find(config.choices, function (c) { return c.id == choiceid });

        slack.send("The lunch destination has been chosen: " + choice.name, function (err) {
          if (err) {
            grunt.log.fail(err);
            done();
          } else {
            db.setWinner(choiceid, function (err) {
              grunt.log.write("The lunch destination has been chosen: " + choice.name);
              if (err) {
                grunt.log.warn("Couldn't set the winner: " + err);
              }
              done();
            });
          }
        });
      }
    });

  });
  
  grunt.registerTask('reminder', 'Sends the lunch reminder to Slack', function () {
    var done = this.async();
    slack.send("Reminder: Vote for your choice for this week's lunch at http://lunch.jamiepenney.co.nz", function (err) {
      if (err) {
        grunt.log.fail(err);
      } else {
        grunt.log.write('Reminder sent');
      }
      done();
    });
  });
};