<script setup lang="ts">

import HelloWorld from './components/HelloWorld.vue'
import type { Api } from  "../../server/index"
import { ref } from 'vue';

const api: Api = new Proxy({} as Api, {
  get(_, moduleName: string) {
    return new Proxy({}, {
      get(_, methodName:string) {
        return async (...args: any[]) => {
          const url = `http://127.0.0.1:3000/api/${moduleName}/${methodName}`;
          const res = await fetch(url, {
            method: "POST",
            body: JSON.stringify(args)
          });
          return await res.json()
        }
      }
    })
  },
})

const access_token = ref("")
const login = async () => {
  let { token } = await api.auth.login("alex", "12138");
  access_token.value = token;
  console.log(token);
}


</script>

<template>
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <HelloWorld msg="Vite + Vue" />
  <button @click="login">登录</button>
  <hr/>
  token : {{access_token}}
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
