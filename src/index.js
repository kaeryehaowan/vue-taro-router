import {
  GOTO,
  BEFORE_EACHS,
  AFTER_EACHS,
  TO,
  FROM,
  RUN_HOOKS,
  CALC_FROM,
  RUN_SYNC_HOOKS,
  TABBAR_LIST,
} from "./constants";
import { isFn, isStr } from "./utlis";
import qs from "qs";
import Taro from '@tarojs/taro';

class VueTaroRouter {
  constructor({ beforeEachs = [], afterEachs = [], tabbarList = [] } = {}) {
    // 路由前置拦截器
    this[BEFORE_EACHS] = beforeEachs;
    // 路由后置拦截器
    this[AFTER_EACHS] = afterEachs;
    // tabbar列表，用于区分调用 navigationTo 还是 switchTab
    this[TABBAR_LIST] = tabbarList;
    this[TO] = null
    this[FROM] = null
  }
  // 设置前置拦截器
  beforeEach(fn) {
    if (!isFn(fn)) {
      throw new Error(
        `[@xsyx/taro-router-vue]: beforeEach should provide function but got ${fn}`
      );
    }
    this[BEFORE_EACHS].push(fn);
    return this;
  }
  // 设置后置拦截器
  afterEach(fn) {
    if (!isFn(fn)) {
      throw new Error(
        `[@xsyx/taro-router-vue]: afterEach should provide function but got ${fn}`
      );
    }
    this[AFTER_EACHS].push(fn);
    return this;
  }
  // 串行执行 hook
  [RUN_HOOKS](fns, done) {
    const hooksCount = fns.length;
    let i = 0;
    const next = () => {
      fns[i++](this[TO], this[FROM], location => {
        if (location) {
          // 如果在拦截器的next有参，则重新跳转
          this[GOTO](location);
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
  [RUN_SYNC_HOOKS](fns) {
    fns.forEach(fn => {
      fn(this[TO], this[FROM]);
    });
  }
  [GOTO](location, type='navigateTo') {
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
    this[FROM] = this[CALC_FROM]();
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
    this[TO] = Object.assign({}, location, {
      path: toPath,
      query: toQuery,
      fullPath: `${toPath}${qs.stringify(toQuery) ? "?" : ""}${qs.stringify(
        toQuery
      )}`
    });
    // 执行hooks
    this[RUN_HOOKS](this[BEFORE_EACHS], () => {
      Taro[type](
        Object.assign({ url: this[TO].fullPath }, location, {
          complete: () => {
            this[RUN_SYNC_HOOKS](this[AFTER_EACHS]);
            location.complete && location.complete();
          },
          
        })
      );
    });
  }
  // 获取当前location
  [CALC_FROM]() {
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
    this[GOTO](location, "navigateTo");
  }
  replace(location) {
    this[GOTO](location, "redirectTo");
  }
  goBack(location) {
    this[GOTO](location, "navigateBack");
  }
  relaunch(location) {
    this[GOTO](location, "reLaunch");
  }
  switchTab(location) {
    this[GOTO](location, "switchTab");
  }

  get query() {
    return this[CALC_FROM]().query
  }
  get path() {
    return this[CALC_FROM]().path
  }
  get fullPath() {
    return this[CALC_FROM]().fullPath
  }

  install(app) {
    app.config.globalProperties.$router = this
  }
}

export { VueTaroRouter };
export default VueTaroRouter;
