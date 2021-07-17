Array.prototype.random = function () {
  const max = this.length - 1;
  const index = Math.floor(Math.random() * (max + 1));
  return this[index];
}

import Vue from 'vue'
import App from './App.vue'

import 'normalize.css'

import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI);

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
