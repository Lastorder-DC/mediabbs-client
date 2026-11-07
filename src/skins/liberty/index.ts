// Liberty: the look of the Liberty MediaWiki skin (librewiki), built on
// Bulma + Buefy. Pair it with the Liberty skin on the wiki for a seamless site.
import Buefy from "buefy";
import type { Skin } from "../types";
import Layout from "./Layout.vue";
import TopicList from "./pages/TopicList.vue";
import Topic from "./pages/Topic.vue";
import "./style.scss";

const skin: Skin = {
  layout: Layout,
  pages: { topicList: TopicList, topic: Topic },
  install(app) {
    app.use(Buefy, { defaultIconPack: "fas" });
  },
};

export default skin;
