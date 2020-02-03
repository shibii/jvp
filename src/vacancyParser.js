module.exports = async (page, config) => {
  await page.goto(config.url);

  // call entry function if present
  if (config.onEntry) {
    await config.onEntry(page);
  }

  // make an array out of the vacancy hrefs
  await page.waitForXPath(config.linkSelector);
  const links = await page.$x(config.linkSelector);
  let vacancies = await page.evaluate((...links) => {
    return links.map(href => {
      return { url: href.href };
    });
  }, ...links);

  // parse vacancy information
  for (let i = 0; i < vacancies.length; i++) {
    await page.goto(vacancies[i].url);

    // call prep function if present
    if (config.beforeContent) {
      await config.beforeContent(page);
    }

    // select elements with text content
    await page.waitFor(config.contentSelector);
    const infos = await page.$x(config.contentSelector);

    const contents = await page.evaluate((...infos) => {
      return infos.map(info => {
        return info.innerText;
      });
    }, ...infos);
    vacancies[i].content = contents.join(" ");
  }
  return vacancies;
};
