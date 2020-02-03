"use strict";

const puppeteer = require("puppeteer");
const lunr = require("lunr");
require("./lunr.stemmer.support.js")(lunr);
require("./lunr.fi.js")(lunr);
require("./lunr.multi.js")(lunr);
const fs = require("fs");
const hashes = require("jshashes");
const date = require("date-and-time");
const parser = require("./vacancyParser");

const sources = require("./sources");

(async () => {
  if (process.argv.length < 3) {
    console.log("pass search terms in a single quoted argument");
    return;
  }
  const seachTerms = process.argv[2];
  console.log("search terms: " + seachTerms);

  const browser = await puppeteer.launch({
    headless: true
  });
  const page = await browser.newPage();

  let vacancies = [];
  for (let i = 0; i < sources.length; i++) {
    try {
      vacancies = vacancies.concat(await parser(page, sources[i]));
    } catch (e) {
      console.log("unable to parse " + sources[i].url);
    }
  }

  // add content hashes to collected vacancies
  vacancies.forEach(vacancy => {
    vacancy.hash = new hashes.MD5().b64(vacancy.content);
  });

  // make a hash table out of the vacancies
  let map = {};
  vacancies.forEach(vacancy => {
    map[vacancy.hash] = { url: vacancy.url, content: vacancy.content };
  });

  // generate lunr search index for vacancy contents
  var index = lunr(function() {
    this.use(lunr.multiLanguage("en", "fi"));
    this.ref("hash");
    this.field("content");
    vacancies.forEach(vacancy => {
      this.add(vacancy);
    });
  });

  // search for interesting vacancies
  const res = index.search(seachTerms);

  // sort out the unseen vacancies
  let seen = JSON.parse(fs.readFileSync("./results/seen.json"));
  let unseen = [];
  res.forEach(match => {
    const hash = match.ref;
    if (!seen[hash]) {
      unseen.push(map[hash].url);
      map[hash].content = undefined;
      seen[hash] = map[hash];
    }
  });
  fs.writeFileSync("./results/seen.json", JSON.stringify(seen));

  console.log("total vacancies parsed: " + vacancies.length);
  console.log("interesting results: " + res.length);
  console.log("unseen interesting results: " + unseen.length);

  const now = new Date();
  const timestamp = date.format(now, "YYYY-MM-DD HH-mm-ss");
  if (unseen.length > 0) {
    fs.writeFileSync(
      "./results/" + timestamp + ".json",
      JSON.stringify(unseen)
    );
  }
  browser.close();
})();
