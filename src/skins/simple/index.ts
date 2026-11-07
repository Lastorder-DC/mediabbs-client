// Simple: a light, dependency-free skin (no UI library). Also a minimal example
// of how to write a skin (see docs/skins.md).
import type { Skin } from "../types";
import Layout from "./Layout.vue";
import TopicList from "./pages/TopicList.vue";
import Topic from "./pages/Topic.vue";
import "./style.css";

const skin: Skin = {
  layout: Layout,
  pages: { topicList: TopicList, topic: Topic },
};

export default skin;
