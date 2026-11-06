import "navigator.locks";
import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";
import "./buefy";
import VueMeta from "vue-meta";
import { Settings } from "luxon";
import { backendHost, loadConfig } from "./config";

Vue.config.productionTip = false;
Vue.use(VueMeta);

// Components read the backend-provided config synchronously, so mount only
// after it has been loaded.
loadConfig()
  .then((config) => {
    Settings.defaultLocale = config.locale;
    new Vue({
      router,
      store,
      render: (h) => h(App),
    }).$mount("#app");
  })
  .catch((error) => {
    console.error(error);
    const el = document.getElementById("app");
    if (el) {
      el.textContent = `서버(${
        backendHost || "백엔드 주소 미설정"
      })에서 설정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.`;
    }
  });
