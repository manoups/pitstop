// Karma configuration file, see link for more information
// https://karma-runner.github.io/latest/config/configuration-file.html
// Used with the @angular/build:karma builder. The builder injects the Angular
// application/polyfills plugin itself; this file provides the jasmine framework,
// launchers and reporters.

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage')
    ],
    jasmineHtmlReporter: {
      suppressAll: true
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu']
      }
    },
    restartOnFileChange: true
  });
};
