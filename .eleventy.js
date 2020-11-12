const fs = require("fs")
const htmlmin = require("html-minifier")
const lodash = require("lodash")
const MarkdownIt = require("markdown-it")
const nunjucks = require("nunjucks")
const path = require("path")
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight")

const components = require("./src/_includes/components/components.config")

const isProduction = process.env.ELEVENTY_ENV === "production"

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight)

  eleventyConfig.addPassthroughCopy("./src/css")
  eleventyConfig.addPassthroughCopy("./src/images")
  eleventyConfig.addPassthroughCopy("./src/fonts")
  eleventyConfig.addPassthroughCopy({ static: "/" })

  /**
   * Reads a file in the _includes directory and returns the result.
   */
  const readIncludeFile = filePath => {
    return fs.readFileSync(path.join(__dirname, `src/_includes/${filePath}`), "utf8")
  }

  /**
   * Renders component by passing in named arguments to the "component"
   * shortcode.
   */
  eleventyConfig.addNunjucksShortcode("component", (name, props) => {
    let component = components[name]
    if (!component) return console.error(`Component not properly configured: ${name}`)

    if (component.transformer) props = component.transformer(props || {})

    return nunjucks.renderString(readIncludeFile(component.template), { ...props })
  })

  /**
   * Captures an input string and converts markdown to HTML
   */
  eleventyConfig.addPairedNunjucksShortcode("markdown", input => {
    const md = new MarkdownIt()
    return md.render(input)
  })

  /**
   * Reads an SVG from file and inserts its content directly on the page.
   */
  eleventyConfig.addNunjucksShortcode("svg", name => readIncludeFile(`svg/${name}.svg`))

  /**
   * Minify files in production.
   */
  eleventyConfig.addTransform("compress-html", (content, outputPath) => {
    if (!outputPath.endsWith(".html") || !isProduction) return content
    const minOpts = {
      useShortDoctype: true,
      removeComments: true,
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    }
    return htmlmin.minify(content, minOpts)
  })

  /**
   * Extract a collection from Eleventy's collectionApi using a "model"
   * frontmatter key.
   *
   * @param {object} api collectionApi objecf from Eleventy
   * @param {string} model Name of the model to extract (looks for "model"
   * frontmatter)
   */
  const extractCollection = (api, model) => {
    return api.getAll().filter(({ data }) => data.model === model)
  }

  /**
   * Creates the "tags" collection using the "model" frontmatter value, and
   * makes an association to the tag's posts..
   */
  eleventyConfig.addCollection("tags", function (collectionApi) {
    // Get raw tags and posts collection data.
    let tags = extractCollection(collectionApi, "Tag")
    const posts = extractCollection(collectionApi, "Post").sort((a, b) => b.date - a.date)
    // Apply posts relationship using the tag "title" as they key.
    const postIncludesTag = (post, tag) => (post.data.tags || []).includes(tag.data.title)
    tags.map(tag => (tag.data.posts = posts.filter(post => postIncludesTag(post, tag))))
    // Return the tags collection.
    return tags
  })

  /**
   * Creates the "posts" collection using the "model" frontmatter value.
   */
  eleventyConfig.addCollection("posts", function (collectionApi) {
    // Get raw tags and posts collection data.
    let posts = extractCollection(collectionApi, "Post").sort((a, b) => b.date - a.date)
    const tags = extractCollection(collectionApi, "Tag").sort((a, b) => a.data.title - b.data.title)
    // Replace tags with a tag object.
    const findTagObj = title => lodash.find(tags, tag => tag.data.title === title)
    posts.map(post => {
      let postTags = post.data.tags.map(tagName => findTagObj(tagName))
      post.data.tags = lodash.compact(postTags)
    })
    // Return the tags collection.
    return posts
  })

  /**
   * Extracts a property from an object by first looking for a data object, then
   * falling back to the object itself.
   */
  eleventyConfig.addNunjucksFilter("getProp", (obj, prop, defaultValue) => {
    const dataSource = typeof obj.data === "object" ? obj.data : obj
    return lodash.get(dataSource, prop) || defaultValue
  })

  return {
    dir: {
      includes: "_includes",
      input: "src",
      layouts: "_layouts",
      output: "dist"
    },
    markdownTemplateEngine: "njk"
  }
}
