import { Serve } from "bun";

const api = {
  auth: {
    async login(username: string, password: string) {
      return {
        token: btoa(username + password),
        username,
        password
      }
    }
  }
}

export type Api = typeof api

// console.log(await api.auth.login("user", "pass"))

export default {
  async fetch(req) {
    const url = new URL(req.url)
    // console.log(url);
    const [_, moduleName, methodName] = url.pathname.slice(1).split("/")
    // 获取body(json格式)
    const body = await req.json()
    const result = await (api as any)[moduleName][methodName](...body)
    return Response.json(result, {
      headers: {
        'Access-Control-Allow-Origin': "*"
      }
    });
  },
  port: 3000
} as Serve

