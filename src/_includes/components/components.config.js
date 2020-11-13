module.exports = {
  button: {
    transformer: require("./button/button.transformer"),
    template: "components/button/button.template.njk"
  },
  image: {
    transformer: require("./image/image.transformer"),
    template: "components/image/image.template.njk"
  },
  particles: {
    transformer: require("./particles/particles.transformer"),
    template: "components/particles/particles.template.njk"
  },
  post_card: {
    transformer: require("./post_card/post_card.transformer"),
    template: "components/post_card/post_card.template.njk"
  },
  seo: {
    transformer: require("./seo/seo.transformer"),
    template: "components/seo/seo.template.njk"
  },
  typewriter: {
    transformer: require("./typewriter/typewriter.transformer"),
    template: "components/typewriter/typewriter.template.njk"
  }
}
