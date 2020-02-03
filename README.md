A simple automated nodejs program that parses recently opened job vacancies from multiple sources.

The program uses puppeteer to crawl the provided sources. The job vacancy text contents are searched for keywords using lunr library. Text contents are hashed with jshashes and stored in order to not show already seen vacancies.

I have not included the sources.js file and sites folder that has the config files that provide the specific job vacancy websites and the corresponding xpath selectors. The program does not function as is. The program is not intended for public use.
