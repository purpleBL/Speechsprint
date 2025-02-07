
// Change this to your repository name
var GHPATH = '/Speechsprint';
 
// Choose a different app prefix name
var APP_PREFIX = 'spchspr_';
 
// The version of the cache. Every time you change any of the files
// you need to change this version (version_01, version_02…). 
// If you don't change the version, the service worker will give your
// users the old files!
var VERSION = 'version_01';
 
// The files to make available for offline use. make sure to add 
// others to this list
var URLS = [
  `${GHPATH}/`,
  `${GHPATH}/index.html`,
  `${GHPATH}/style.css`,
  `${GHPATH}/script.js`,
  `${GHPATH}/sw.js`,
  `${GHPATH}/manifest.json`,
  `${GHPATH}/file-upload.svg`,
  `${GHPATH}/trash.svg`,
  `${GHPATH}/icon-192x192.png`,
  `${GHPATH}/icon-512x512.png`,
];
