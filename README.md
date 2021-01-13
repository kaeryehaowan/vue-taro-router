### VueTaroRouter

基本 Taro ，扩展成 vue-router 的使用体验

### Installation
```js
npm i vue-taro-router -S
```

### Usage

```js
// router.js
import VueTaroRouter from "vue-taro-router";
const router = new VueTaroRouter();

// 添加拦截器
router
  .beforeEach((to, from, next) => {
    console.log(to);
    console.log(from);
    next();
  })
  .beforeEach((to, from, next) => {
    if (~to.path.indexOf("abc2")) {
      // 在拦截器里重定向
      next({
        path: "/pages/home/index",
        success() {
          console.log("success");
        }
      });
    } else {
      next();
    }
  })
  .afterEach((to, from) => {
    console.log("afterEach:", to);
    console.log("afterEach:", from);
  });

export default router;
```

```js
// app.js
import Vue from "vue";
import router from "./router.js";

Vue.use(router);
```

```js
// page.vue
this.$router.push({
  path: "/page/abc2/index",
  query: { id: "123" },
  events: {
    // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
    acceptDataFromOpenedPage: function(data) {
      console.log(data);
    },
    someEvent: function(data) {
      console.log(data);
    }
  },
  complete() {
    // 不论成功失败，都会执行这里
  },
  fail(err) {
    // 失败，执行这里
    console.log(err);
  },
  success: function(res) {
    // 成功，执行这里
    // 通过eventChannel向被打开页面传送数据
    res.eventChannel.emit("acceptDataFromOpenerPage", { data: "test" });
  }
});
```

### Methods

```js
this.$router.push(options);
this.$router.replace(options);
this.$router.goBack(options);
this.$router.relaunch(options);
this.$router.switchTab(options);

// 添加前置拦截器
this.$router.beforeEach(beforeEach);

// 添加后置响应器
this.$router.afterEach(afterEach);
```

### options 路由跳转入参

| 属性     | 类型     | 必填 | 描述                                                            |
| -------- | -------- | ---- | --------------------------------------------------------------- |
| path     | string   | 是   | 路径 （replace 方法可不传）                                     |
| delta    | number   | 否   | 返回的页面数，如果 delta 大于现有页面数，则返回到首页。默认为 1 |
| query    | object   | 否   | 查询参数                                                        |
| events   | object   | 否   | 页面间通信接口，用于监听被打开页面发送到当前页面的数据          |
| complete | function | 否   | 接口调用结束的回调函数（调用成功、失败都会执行）                |
| fail     | function | 否   | 接口调用失败的回调函数                                          |
| success  | function | 否   | 接口调用成功的回调函数                                          |

### 属性

```js
this.$router.query;
this.$router.path;
this.$router.fullPath;
```
