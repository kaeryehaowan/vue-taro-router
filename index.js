import {
  goto,
  beforeEachs,
  afterEachs,
  to,
  from,
  runHooks,
  calcFrom,
  runSyncHooks,
  tabbarList
} from "./constants";
import { isFn, isStr } from "./utlis";
import qs from "qs";

class VueTaroRouter {
  // 路由前置拦截器
  [beforeEachs] = [];
  // 路由后置拦截器
  [afterEachs] = [];
  // tabbar列表，用于区分调用 navigationTo 还是 switchTab
  [tabbarList] = [];
  [to] = null;
  [from] = null;

  constructor({ beforeEachs = [], afterEachs = [], tabbarList = [] } = {}) {
    this[beforeEachs] = beforeEachs;
    this[afterEachs] = afterEachs;
    this[tabbarList] = tabbarList;
  }
  // 设置前置拦截器
  beforeEach(fn) {
    if (!isFn(fn)) {
      throw new Error(
        `[@xsyx/taro-router-vue]: beforeEach should provide function but got ${fn}`
      );
    }
    this[beforeEachs].push(fn);
    return this;
  }
  // 设置后置拦截器
  afterEach(fn) {
    if (!isFn(fn)) {
      throw new Error(
        `[@xsyx/taro-router-vue]: afterEach should provide function but got ${fn}`
      );
    }
    this[afterEachs].push(fn);
    return this;
  }
  // 串行执行 hook
  [runHooks](fns, done) {
    const hooksCount = fns.length;
    let i = 0;
    const next = () => {
      fns[i++](this[to], this[from], location => {
        if (location) {
          // 如果在拦截器的next有参，则重新跳转
          this[goto](location);
        } else {
          if (i < hooksCount) {
            // 拦截器还未全部执行完
            next();
          } else {
            // 拦截器执行完成
            done();
          }
        }
      });
    };
    next();
  }
  // 并行执行 hook
  [runSyncHooks](fns) {
    fns.forEach(fn => {
      fn(this[to], this[from]);
    });
  }
  [goto](location, type='navigateTo') {
    if (!isStr(location.path)) {
      throw new Error(
        `[@xsyx/taro-router-vue]: path should provide string but got ${location.path}`
      );
    }
    const isBack = type === "navigateBack";
    if (!isBack && !location.path) {
      throw new Error(`[@xsyx/taro-router-vue]: path is not defined`);
    }
    // 更新from
    this[from] = this[calcFrom]();
    // 更新to
    let toPath,_toQuery,_toPathQuery,toQuery;
    if (isBack) {
      if(!location.delta) location.delta = 1
      // 得到页面栈
      const pageStack = getCurrentPages();
      const _toIndex = pageStack.length - 1 - location.delta
      if(_toIndex<0) _toIndex = 0
      // 得到toPage
      const _toPage = pageStack[_toIndex]
      toPath = _toPage.route
      _toPathQuery = qs.stringify(_toPage.options)
    } else {
      toPath = location.path.split("?")[0];
      _toPathQuery = location.path.split("?")[1]
        ? location.path.split("?")[1]
        : "";
    }
    _toQuery = JSON.parse(
      JSON.stringify(location.query ? location.query : {})
    );
    toQuery = { ..._toQuery, ...qs.parse(_toPathQuery) };
    this[to] = Object.assign({}, location, {
      path: toPath,
      query: toQuery,
      fullPath: `${toPath}${qs.stringify(toQuery) ? "?" : ""}${qs.stringify(
        toQuery
      )}`
    });
    // 执行hooks
    this[runHooks](this[beforeEachs], () => {
      wx[type](
        Object.assign({ url: this[to].fullPath }, location, {
          complete: () => {
            this[runSyncHooks](this[afterEachs]);
            location.complete && location.complete();
          },
          
        })
      );
    });
  }
  // 获取当前location
  [calcFrom]() {
    // 得到页面栈
    const pageStack = getCurrentPages();
    const lastPage = pageStack[pageStack.length - 1];
    if (!lastPage) return null;
    const query = lastPage.options;
    delete query.__key_;
    return {
      path: lastPage.route,
      query,
      fullPath: `${lastPage.route}${
        qs.stringify(query) ? "?" : ""
      }${qs.stringify(query)}`
    };
  }

  push(location) {
    this[goto](location, "navigateTo");
  }
  replace(location) {
    this[goto](location, "redirectTo");
  }
  goBack(location) {
    this[goto](location, "navigateBack");
  }
  relaunch(location) {
    this[goto](location, "reLaunch");
  }
  switchTab(location) {
    this[goto](location, "switchTab");
  }

  get query() {
    return this[calcFrom]().query
  }
  get path() {
    return this[calcFrom]().path
  }
  get fullPath() {
    return this[calcFrom]().fullPath
  }

  install(Vue) {
    Object.defineProperty(Vue.prototype, '$router', {value: this})
  }
}

export { VueTaroRouter };
export default VueTaroRouter;
