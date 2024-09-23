(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };

  // node_modules/alpinejs/dist/module.esm.js
  var flushPending = false;
  var flushing = false;
  var queue = [];
  var lastFlushedIndex = -1;
  function scheduler(callback) {
    queueJob(callback);
  }
  function queueJob(job) {
    if (!queue.includes(job))
      queue.push(job);
    queueFlush();
  }
  function dequeueJob(job) {
    let index = queue.indexOf(job);
    if (index !== -1 && index > lastFlushedIndex)
      queue.splice(index, 1);
  }
  function queueFlush() {
    if (!flushing && !flushPending) {
      flushPending = true;
      queueMicrotask(flushJobs);
    }
  }
  function flushJobs() {
    flushPending = false;
    flushing = true;
    for (let i = 0; i < queue.length; i++) {
      queue[i]();
      lastFlushedIndex = i;
    }
    queue.length = 0;
    lastFlushedIndex = -1;
    flushing = false;
  }
  var reactive;
  var effect;
  var release;
  var raw;
  var shouldSchedule = true;
  function disableEffectScheduling(callback) {
    shouldSchedule = false;
    callback();
    shouldSchedule = true;
  }
  function setReactivityEngine(engine) {
    reactive = engine.reactive;
    release = engine.release;
    effect = (callback) => engine.effect(callback, { scheduler: (task) => {
      if (shouldSchedule) {
        scheduler(task);
      } else {
        task();
      }
    } });
    raw = engine.raw;
  }
  function overrideEffect(override) {
    effect = override;
  }
  function elementBoundEffect(el) {
    let cleanup2 = () => {
    };
    let wrappedEffect = (callback) => {
      let effectReference = effect(callback);
      if (!el._x_effects) {
        el._x_effects = /* @__PURE__ */ new Set();
        el._x_runEffects = () => {
          el._x_effects.forEach((i) => i());
        };
      }
      el._x_effects.add(effectReference);
      cleanup2 = () => {
        if (effectReference === void 0)
          return;
        el._x_effects.delete(effectReference);
        release(effectReference);
      };
      return effectReference;
    };
    return [wrappedEffect, () => {
      cleanup2();
    }];
  }
  function watch(getter, callback) {
    let firstTime = true;
    let oldValue;
    let effectReference = effect(() => {
      let value = getter();
      JSON.stringify(value);
      if (!firstTime) {
        queueMicrotask(() => {
          callback(value, oldValue);
          oldValue = value;
        });
      } else {
        oldValue = value;
      }
      firstTime = false;
    });
    return () => release(effectReference);
  }
  function dispatch(el, name, detail = {}) {
    el.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true,
        cancelable: true
      })
    );
  }
  function walk(el, callback) {
    if (typeof ShadowRoot === "function" && el instanceof ShadowRoot) {
      Array.from(el.children).forEach((el2) => walk(el2, callback));
      return;
    }
    let skip = false;
    callback(el, () => skip = true);
    if (skip)
      return;
    let node = el.firstElementChild;
    while (node) {
      walk(node, callback, false);
      node = node.nextElementSibling;
    }
  }
  function warn(message, ...args) {
    console.warn(`Alpine Warning: ${message}`, ...args);
  }
  var started = false;
  function start() {
    if (started)
      warn("Alpine has already been initialized on this page. Calling Alpine.start() more than once can cause problems.");
    started = true;
    if (!document.body)
      warn("Unable to initialize. Trying to load Alpine before `<body>` is available. Did you forget to add `defer` in Alpine's `<script>` tag?");
    dispatch(document, "alpine:init");
    dispatch(document, "alpine:initializing");
    startObservingMutations();
    onElAdded((el) => initTree(el, walk));
    onElRemoved((el) => destroyTree(el));
    onAttributesAdded((el, attrs) => {
      directives(el, attrs).forEach((handle) => handle());
    });
    let outNestedComponents = (el) => !closestRoot(el.parentElement, true);
    Array.from(document.querySelectorAll(allSelectors().join(","))).filter(outNestedComponents).forEach((el) => {
      initTree(el);
    });
    dispatch(document, "alpine:initialized");
  }
  var rootSelectorCallbacks = [];
  var initSelectorCallbacks = [];
  function rootSelectors() {
    return rootSelectorCallbacks.map((fn) => fn());
  }
  function allSelectors() {
    return rootSelectorCallbacks.concat(initSelectorCallbacks).map((fn) => fn());
  }
  function addRootSelector(selectorCallback) {
    rootSelectorCallbacks.push(selectorCallback);
  }
  function addInitSelector(selectorCallback) {
    initSelectorCallbacks.push(selectorCallback);
  }
  function closestRoot(el, includeInitSelectors = false) {
    return findClosest(el, (element) => {
      const selectors = includeInitSelectors ? allSelectors() : rootSelectors();
      if (selectors.some((selector) => element.matches(selector)))
        return true;
    });
  }
  function findClosest(el, callback) {
    if (!el)
      return;
    if (callback(el))
      return el;
    if (el._x_teleportBack)
      el = el._x_teleportBack;
    if (!el.parentElement)
      return;
    return findClosest(el.parentElement, callback);
  }
  function isRoot(el) {
    return rootSelectors().some((selector) => el.matches(selector));
  }
  var initInterceptors = [];
  function interceptInit(callback) {
    initInterceptors.push(callback);
  }
  function initTree(el, walker = walk, intercept = () => {
  }) {
    deferHandlingDirectives(() => {
      walker(el, (el2, skip) => {
        intercept(el2, skip);
        initInterceptors.forEach((i) => i(el2, skip));
        directives(el2, el2.attributes).forEach((handle) => handle());
        el2._x_ignore && skip();
      });
    });
  }
  function destroyTree(root, walker = walk) {
    walker(root, (el) => {
      cleanupAttributes(el);
      cleanupElement(el);
    });
  }
  var onAttributeAddeds = [];
  var onElRemoveds = [];
  var onElAddeds = [];
  function onElAdded(callback) {
    onElAddeds.push(callback);
  }
  function onElRemoved(el, callback) {
    if (typeof callback === "function") {
      if (!el._x_cleanups)
        el._x_cleanups = [];
      el._x_cleanups.push(callback);
    } else {
      callback = el;
      onElRemoveds.push(callback);
    }
  }
  function onAttributesAdded(callback) {
    onAttributeAddeds.push(callback);
  }
  function onAttributeRemoved(el, name, callback) {
    if (!el._x_attributeCleanups)
      el._x_attributeCleanups = {};
    if (!el._x_attributeCleanups[name])
      el._x_attributeCleanups[name] = [];
    el._x_attributeCleanups[name].push(callback);
  }
  function cleanupAttributes(el, names) {
    if (!el._x_attributeCleanups)
      return;
    Object.entries(el._x_attributeCleanups).forEach(([name, value]) => {
      if (names === void 0 || names.includes(name)) {
        value.forEach((i) => i());
        delete el._x_attributeCleanups[name];
      }
    });
  }
  function cleanupElement(el) {
    if (el._x_cleanups) {
      while (el._x_cleanups.length)
        el._x_cleanups.pop()();
    }
  }
  var observer = new MutationObserver(onMutate);
  var currentlyObserving = false;
  function startObservingMutations() {
    observer.observe(document, { subtree: true, childList: true, attributes: true, attributeOldValue: true });
    currentlyObserving = true;
  }
  function stopObservingMutations() {
    flushObserver();
    observer.disconnect();
    currentlyObserving = false;
  }
  var queuedMutations = [];
  function flushObserver() {
    let records = observer.takeRecords();
    queuedMutations.push(() => records.length > 0 && onMutate(records));
    let queueLengthWhenTriggered = queuedMutations.length;
    queueMicrotask(() => {
      if (queuedMutations.length === queueLengthWhenTriggered) {
        while (queuedMutations.length > 0)
          queuedMutations.shift()();
      }
    });
  }
  function mutateDom(callback) {
    if (!currentlyObserving)
      return callback();
    stopObservingMutations();
    let result = callback();
    startObservingMutations();
    return result;
  }
  var isCollecting = false;
  var deferredMutations = [];
  function deferMutations() {
    isCollecting = true;
  }
  function flushAndStopDeferringMutations() {
    isCollecting = false;
    onMutate(deferredMutations);
    deferredMutations = [];
  }
  function onMutate(mutations) {
    if (isCollecting) {
      deferredMutations = deferredMutations.concat(mutations);
      return;
    }
    let addedNodes = /* @__PURE__ */ new Set();
    let removedNodes = /* @__PURE__ */ new Set();
    let addedAttributes = /* @__PURE__ */ new Map();
    let removedAttributes = /* @__PURE__ */ new Map();
    for (let i = 0; i < mutations.length; i++) {
      if (mutations[i].target._x_ignoreMutationObserver)
        continue;
      if (mutations[i].type === "childList") {
        mutations[i].addedNodes.forEach((node) => node.nodeType === 1 && addedNodes.add(node));
        mutations[i].removedNodes.forEach((node) => node.nodeType === 1 && removedNodes.add(node));
      }
      if (mutations[i].type === "attributes") {
        let el = mutations[i].target;
        let name = mutations[i].attributeName;
        let oldValue = mutations[i].oldValue;
        let add2 = () => {
          if (!addedAttributes.has(el))
            addedAttributes.set(el, []);
          addedAttributes.get(el).push({ name, value: el.getAttribute(name) });
        };
        let remove = () => {
          if (!removedAttributes.has(el))
            removedAttributes.set(el, []);
          removedAttributes.get(el).push(name);
        };
        if (el.hasAttribute(name) && oldValue === null) {
          add2();
        } else if (el.hasAttribute(name)) {
          remove();
          add2();
        } else {
          remove();
        }
      }
    }
    removedAttributes.forEach((attrs, el) => {
      cleanupAttributes(el, attrs);
    });
    addedAttributes.forEach((attrs, el) => {
      onAttributeAddeds.forEach((i) => i(el, attrs));
    });
    for (let node of removedNodes) {
      if (addedNodes.has(node))
        continue;
      onElRemoveds.forEach((i) => i(node));
      destroyTree(node);
    }
    addedNodes.forEach((node) => {
      node._x_ignoreSelf = true;
      node._x_ignore = true;
    });
    for (let node of addedNodes) {
      if (removedNodes.has(node))
        continue;
      if (!node.isConnected)
        continue;
      delete node._x_ignoreSelf;
      delete node._x_ignore;
      onElAddeds.forEach((i) => i(node));
      node._x_ignore = true;
      node._x_ignoreSelf = true;
    }
    addedNodes.forEach((node) => {
      delete node._x_ignoreSelf;
      delete node._x_ignore;
    });
    addedNodes = null;
    removedNodes = null;
    addedAttributes = null;
    removedAttributes = null;
  }
  function scope(node) {
    return mergeProxies(closestDataStack(node));
  }
  function addScopeToNode(node, data2, referenceNode) {
    node._x_dataStack = [data2, ...closestDataStack(referenceNode || node)];
    return () => {
      node._x_dataStack = node._x_dataStack.filter((i) => i !== data2);
    };
  }
  function closestDataStack(node) {
    if (node._x_dataStack)
      return node._x_dataStack;
    if (typeof ShadowRoot === "function" && node instanceof ShadowRoot) {
      return closestDataStack(node.host);
    }
    if (!node.parentNode) {
      return [];
    }
    return closestDataStack(node.parentNode);
  }
  function mergeProxies(objects) {
    return new Proxy({ objects }, mergeProxyTrap);
  }
  var mergeProxyTrap = {
    ownKeys({ objects }) {
      return Array.from(
        new Set(objects.flatMap((i) => Object.keys(i)))
      );
    },
    has({ objects }, name) {
      if (name == Symbol.unscopables)
        return false;
      return objects.some(
        (obj) => Object.prototype.hasOwnProperty.call(obj, name) || Reflect.has(obj, name)
      );
    },
    get({ objects }, name, thisProxy) {
      if (name == "toJSON")
        return collapseProxies;
      return Reflect.get(
        objects.find(
          (obj) => Reflect.has(obj, name)
        ) || {},
        name,
        thisProxy
      );
    },
    set({ objects }, name, value, thisProxy) {
      const target = objects.find(
        (obj) => Object.prototype.hasOwnProperty.call(obj, name)
      ) || objects[objects.length - 1];
      const descriptor = Object.getOwnPropertyDescriptor(target, name);
      if ((descriptor == null ? void 0 : descriptor.set) && (descriptor == null ? void 0 : descriptor.get))
        return Reflect.set(target, name, value, thisProxy);
      return Reflect.set(target, name, value);
    }
  };
  function collapseProxies() {
    let keys = Reflect.ownKeys(this);
    return keys.reduce((acc, key) => {
      acc[key] = Reflect.get(this, key);
      return acc;
    }, {});
  }
  function initInterceptors2(data2) {
    let isObject2 = (val) => typeof val === "object" && !Array.isArray(val) && val !== null;
    let recurse = (obj, basePath = "") => {
      Object.entries(Object.getOwnPropertyDescriptors(obj)).forEach(([key, { value, enumerable }]) => {
        if (enumerable === false || value === void 0)
          return;
        if (typeof value === "object" && value !== null && value.__v_skip)
          return;
        let path = basePath === "" ? key : `${basePath}.${key}`;
        if (typeof value === "object" && value !== null && value._x_interceptor) {
          obj[key] = value.initialize(data2, path, key);
        } else {
          if (isObject2(value) && value !== obj && !(value instanceof Element)) {
            recurse(value, path);
          }
        }
      });
    };
    return recurse(data2);
  }
  function interceptor(callback, mutateObj = () => {
  }) {
    let obj = {
      initialValue: void 0,
      _x_interceptor: true,
      initialize(data2, path, key) {
        return callback(this.initialValue, () => get(data2, path), (value) => set(data2, path, value), path, key);
      }
    };
    mutateObj(obj);
    return (initialValue) => {
      if (typeof initialValue === "object" && initialValue !== null && initialValue._x_interceptor) {
        let initialize = obj.initialize.bind(obj);
        obj.initialize = (data2, path, key) => {
          let innerValue = initialValue.initialize(data2, path, key);
          obj.initialValue = innerValue;
          return initialize(data2, path, key);
        };
      } else {
        obj.initialValue = initialValue;
      }
      return obj;
    };
  }
  function get(obj, path) {
    return path.split(".").reduce((carry, segment) => carry[segment], obj);
  }
  function set(obj, path, value) {
    if (typeof path === "string")
      path = path.split(".");
    if (path.length === 1)
      obj[path[0]] = value;
    else if (path.length === 0)
      throw error;
    else {
      if (obj[path[0]])
        return set(obj[path[0]], path.slice(1), value);
      else {
        obj[path[0]] = {};
        return set(obj[path[0]], path.slice(1), value);
      }
    }
  }
  var magics = {};
  function magic(name, callback) {
    magics[name] = callback;
  }
  function injectMagics(obj, el) {
    Object.entries(magics).forEach(([name, callback]) => {
      let memoizedUtilities = null;
      function getUtilities() {
        if (memoizedUtilities) {
          return memoizedUtilities;
        } else {
          let [utilities, cleanup2] = getElementBoundUtilities(el);
          memoizedUtilities = __spreadValues({ interceptor }, utilities);
          onElRemoved(el, cleanup2);
          return memoizedUtilities;
        }
      }
      Object.defineProperty(obj, `$${name}`, {
        get() {
          return callback(el, getUtilities());
        },
        enumerable: false
      });
    });
    return obj;
  }
  function tryCatch(el, expression, callback, ...args) {
    try {
      return callback(...args);
    } catch (e) {
      handleError(e, el, expression);
    }
  }
  function handleError(error2, el, expression = void 0) {
    error2 = Object.assign(
      error2 != null ? error2 : { message: "No error message given." },
      { el, expression }
    );
    console.warn(`Alpine Expression Error: ${error2.message}

${expression ? 'Expression: "' + expression + '"\n\n' : ""}`, el);
    setTimeout(() => {
      throw error2;
    }, 0);
  }
  var shouldAutoEvaluateFunctions = true;
  function dontAutoEvaluateFunctions(callback) {
    let cache = shouldAutoEvaluateFunctions;
    shouldAutoEvaluateFunctions = false;
    let result = callback();
    shouldAutoEvaluateFunctions = cache;
    return result;
  }
  function evaluate(el, expression, extras = {}) {
    let result;
    evaluateLater(el, expression)((value) => result = value, extras);
    return result;
  }
  function evaluateLater(...args) {
    return theEvaluatorFunction(...args);
  }
  var theEvaluatorFunction = normalEvaluator;
  function setEvaluator(newEvaluator) {
    theEvaluatorFunction = newEvaluator;
  }
  function normalEvaluator(el, expression) {
    let overriddenMagics = {};
    injectMagics(overriddenMagics, el);
    let dataStack = [overriddenMagics, ...closestDataStack(el)];
    let evaluator = typeof expression === "function" ? generateEvaluatorFromFunction(dataStack, expression) : generateEvaluatorFromString(dataStack, expression, el);
    return tryCatch.bind(null, el, expression, evaluator);
  }
  function generateEvaluatorFromFunction(dataStack, func) {
    return (receiver = () => {
    }, { scope: scope2 = {}, params = [] } = {}) => {
      let result = func.apply(mergeProxies([scope2, ...dataStack]), params);
      runIfTypeOfFunction(receiver, result);
    };
  }
  var evaluatorMemo = {};
  function generateFunctionFromString(expression, el) {
    if (evaluatorMemo[expression]) {
      return evaluatorMemo[expression];
    }
    let AsyncFunction = Object.getPrototypeOf(async function() {
    }).constructor;
    let rightSideSafeExpression = /^[\n\s]*if.*\(.*\)/.test(expression.trim()) || /^(let|const)\s/.test(expression.trim()) ? `(async()=>{ ${expression} })()` : expression;
    const safeAsyncFunction = () => {
      try {
        let func2 = new AsyncFunction(
          ["__self", "scope"],
          `with (scope) { __self.result = ${rightSideSafeExpression} }; __self.finished = true; return __self.result;`
        );
        Object.defineProperty(func2, "name", {
          value: `[Alpine] ${expression}`
        });
        return func2;
      } catch (error2) {
        handleError(error2, el, expression);
        return Promise.resolve();
      }
    };
    let func = safeAsyncFunction();
    evaluatorMemo[expression] = func;
    return func;
  }
  function generateEvaluatorFromString(dataStack, expression, el) {
    let func = generateFunctionFromString(expression, el);
    return (receiver = () => {
    }, { scope: scope2 = {}, params = [] } = {}) => {
      func.result = void 0;
      func.finished = false;
      let completeScope = mergeProxies([scope2, ...dataStack]);
      if (typeof func === "function") {
        let promise = func(func, completeScope).catch((error2) => handleError(error2, el, expression));
        if (func.finished) {
          runIfTypeOfFunction(receiver, func.result, completeScope, params, el);
          func.result = void 0;
        } else {
          promise.then((result) => {
            runIfTypeOfFunction(receiver, result, completeScope, params, el);
          }).catch((error2) => handleError(error2, el, expression)).finally(() => func.result = void 0);
        }
      }
    };
  }
  function runIfTypeOfFunction(receiver, value, scope2, params, el) {
    if (shouldAutoEvaluateFunctions && typeof value === "function") {
      let result = value.apply(scope2, params);
      if (result instanceof Promise) {
        result.then((i) => runIfTypeOfFunction(receiver, i, scope2, params)).catch((error2) => handleError(error2, el, value));
      } else {
        receiver(result);
      }
    } else if (typeof value === "object" && value instanceof Promise) {
      value.then((i) => receiver(i));
    } else {
      receiver(value);
    }
  }
  var prefixAsString = "x-";
  function prefix(subject = "") {
    return prefixAsString + subject;
  }
  function setPrefix(newPrefix) {
    prefixAsString = newPrefix;
  }
  var directiveHandlers = {};
  function directive(name, callback) {
    directiveHandlers[name] = callback;
    return {
      before(directive2) {
        if (!directiveHandlers[directive2]) {
          console.warn(String.raw`Cannot find directive \`${directive2}\`. \`${name}\` will use the default order of execution`);
          return;
        }
        const pos = directiveOrder.indexOf(directive2);
        directiveOrder.splice(pos >= 0 ? pos : directiveOrder.indexOf("DEFAULT"), 0, name);
      }
    };
  }
  function directives(el, attributes, originalAttributeOverride) {
    attributes = Array.from(attributes);
    if (el._x_virtualDirectives) {
      let vAttributes = Object.entries(el._x_virtualDirectives).map(([name, value]) => ({ name, value }));
      let staticAttributes = attributesOnly(vAttributes);
      vAttributes = vAttributes.map((attribute) => {
        if (staticAttributes.find((attr) => attr.name === attribute.name)) {
          return {
            name: `x-bind:${attribute.name}`,
            value: `"${attribute.value}"`
          };
        }
        return attribute;
      });
      attributes = attributes.concat(vAttributes);
    }
    let transformedAttributeMap = {};
    let directives2 = attributes.map(toTransformedAttributes((newName, oldName) => transformedAttributeMap[newName] = oldName)).filter(outNonAlpineAttributes).map(toParsedDirectives(transformedAttributeMap, originalAttributeOverride)).sort(byPriority);
    return directives2.map((directive2) => {
      return getDirectiveHandler(el, directive2);
    });
  }
  function attributesOnly(attributes) {
    return Array.from(attributes).map(toTransformedAttributes()).filter((attr) => !outNonAlpineAttributes(attr));
  }
  var isDeferringHandlers = false;
  var directiveHandlerStacks = /* @__PURE__ */ new Map();
  var currentHandlerStackKey = Symbol();
  function deferHandlingDirectives(callback) {
    isDeferringHandlers = true;
    let key = Symbol();
    currentHandlerStackKey = key;
    directiveHandlerStacks.set(key, []);
    let flushHandlers = () => {
      while (directiveHandlerStacks.get(key).length)
        directiveHandlerStacks.get(key).shift()();
      directiveHandlerStacks.delete(key);
    };
    let stopDeferring = () => {
      isDeferringHandlers = false;
      flushHandlers();
    };
    callback(flushHandlers);
    stopDeferring();
  }
  function getElementBoundUtilities(el) {
    let cleanups = [];
    let cleanup2 = (callback) => cleanups.push(callback);
    let [effect3, cleanupEffect] = elementBoundEffect(el);
    cleanups.push(cleanupEffect);
    let utilities = {
      Alpine: alpine_default,
      effect: effect3,
      cleanup: cleanup2,
      evaluateLater: evaluateLater.bind(evaluateLater, el),
      evaluate: evaluate.bind(evaluate, el)
    };
    let doCleanup = () => cleanups.forEach((i) => i());
    return [utilities, doCleanup];
  }
  function getDirectiveHandler(el, directive2) {
    let noop = () => {
    };
    let handler4 = directiveHandlers[directive2.type] || noop;
    let [utilities, cleanup2] = getElementBoundUtilities(el);
    onAttributeRemoved(el, directive2.original, cleanup2);
    let fullHandler = () => {
      if (el._x_ignore || el._x_ignoreSelf)
        return;
      handler4.inline && handler4.inline(el, directive2, utilities);
      handler4 = handler4.bind(handler4, el, directive2, utilities);
      isDeferringHandlers ? directiveHandlerStacks.get(currentHandlerStackKey).push(handler4) : handler4();
    };
    fullHandler.runCleanups = cleanup2;
    return fullHandler;
  }
  var startingWith = (subject, replacement) => ({ name, value }) => {
    if (name.startsWith(subject))
      name = name.replace(subject, replacement);
    return { name, value };
  };
  var into = (i) => i;
  function toTransformedAttributes(callback = () => {
  }) {
    return ({ name, value }) => {
      let { name: newName, value: newValue } = attributeTransformers.reduce((carry, transform) => {
        return transform(carry);
      }, { name, value });
      if (newName !== name)
        callback(newName, name);
      return { name: newName, value: newValue };
    };
  }
  var attributeTransformers = [];
  function mapAttributes(callback) {
    attributeTransformers.push(callback);
  }
  function outNonAlpineAttributes({ name }) {
    return alpineAttributeRegex().test(name);
  }
  var alpineAttributeRegex = () => new RegExp(`^${prefixAsString}([^:^.]+)\\b`);
  function toParsedDirectives(transformedAttributeMap, originalAttributeOverride) {
    return ({ name, value }) => {
      let typeMatch = name.match(alpineAttributeRegex());
      let valueMatch = name.match(/:([a-zA-Z0-9\-_:]+)/);
      let modifiers = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];
      let original = originalAttributeOverride || transformedAttributeMap[name] || name;
      return {
        type: typeMatch ? typeMatch[1] : null,
        value: valueMatch ? valueMatch[1] : null,
        modifiers: modifiers.map((i) => i.replace(".", "")),
        expression: value,
        original
      };
    };
  }
  var DEFAULT = "DEFAULT";
  var directiveOrder = [
    "ignore",
    "ref",
    "data",
    "id",
    "anchor",
    "bind",
    "init",
    "for",
    "model",
    "modelable",
    "transition",
    "show",
    "if",
    DEFAULT,
    "teleport"
  ];
  function byPriority(a, b) {
    let typeA = directiveOrder.indexOf(a.type) === -1 ? DEFAULT : a.type;
    let typeB = directiveOrder.indexOf(b.type) === -1 ? DEFAULT : b.type;
    return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB);
  }
  var tickStack = [];
  var isHolding = false;
  function nextTick(callback = () => {
  }) {
    queueMicrotask(() => {
      isHolding || setTimeout(() => {
        releaseNextTicks();
      });
    });
    return new Promise((res) => {
      tickStack.push(() => {
        callback();
        res();
      });
    });
  }
  function releaseNextTicks() {
    isHolding = false;
    while (tickStack.length)
      tickStack.shift()();
  }
  function holdNextTicks() {
    isHolding = true;
  }
  function setClasses(el, value) {
    if (Array.isArray(value)) {
      return setClassesFromString(el, value.join(" "));
    } else if (typeof value === "object" && value !== null) {
      return setClassesFromObject(el, value);
    } else if (typeof value === "function") {
      return setClasses(el, value());
    }
    return setClassesFromString(el, value);
  }
  function setClassesFromString(el, classString) {
    let split = (classString2) => classString2.split(" ").filter(Boolean);
    let missingClasses = (classString2) => classString2.split(" ").filter((i) => !el.classList.contains(i)).filter(Boolean);
    let addClassesAndReturnUndo = (classes) => {
      el.classList.add(...classes);
      return () => {
        el.classList.remove(...classes);
      };
    };
    classString = classString === true ? classString = "" : classString || "";
    return addClassesAndReturnUndo(missingClasses(classString));
  }
  function setClassesFromObject(el, classObject) {
    let split = (classString) => classString.split(" ").filter(Boolean);
    let forAdd = Object.entries(classObject).flatMap(([classString, bool]) => bool ? split(classString) : false).filter(Boolean);
    let forRemove = Object.entries(classObject).flatMap(([classString, bool]) => !bool ? split(classString) : false).filter(Boolean);
    let added = [];
    let removed = [];
    forRemove.forEach((i) => {
      if (el.classList.contains(i)) {
        el.classList.remove(i);
        removed.push(i);
      }
    });
    forAdd.forEach((i) => {
      if (!el.classList.contains(i)) {
        el.classList.add(i);
        added.push(i);
      }
    });
    return () => {
      removed.forEach((i) => el.classList.add(i));
      added.forEach((i) => el.classList.remove(i));
    };
  }
  function setStyles(el, value) {
    if (typeof value === "object" && value !== null) {
      return setStylesFromObject(el, value);
    }
    return setStylesFromString(el, value);
  }
  function setStylesFromObject(el, value) {
    let previousStyles = {};
    Object.entries(value).forEach(([key, value2]) => {
      previousStyles[key] = el.style[key];
      if (!key.startsWith("--")) {
        key = kebabCase(key);
      }
      el.style.setProperty(key, value2);
    });
    setTimeout(() => {
      if (el.style.length === 0) {
        el.removeAttribute("style");
      }
    });
    return () => {
      setStyles(el, previousStyles);
    };
  }
  function setStylesFromString(el, value) {
    let cache = el.getAttribute("style", value);
    el.setAttribute("style", value);
    return () => {
      el.setAttribute("style", cache || "");
    };
  }
  function kebabCase(subject) {
    return subject.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }
  function once(callback, fallback = () => {
  }) {
    let called = false;
    return function() {
      if (!called) {
        called = true;
        callback.apply(this, arguments);
      } else {
        fallback.apply(this, arguments);
      }
    };
  }
  directive("transition", (el, { value, modifiers, expression }, { evaluate: evaluate2 }) => {
    if (typeof expression === "function")
      expression = evaluate2(expression);
    if (expression === false)
      return;
    if (!expression || typeof expression === "boolean") {
      registerTransitionsFromHelper(el, modifiers, value);
    } else {
      registerTransitionsFromClassString(el, expression, value);
    }
  });
  function registerTransitionsFromClassString(el, classString, stage) {
    registerTransitionObject(el, setClasses, "");
    let directiveStorageMap = {
      "enter": (classes) => {
        el._x_transition.enter.during = classes;
      },
      "enter-start": (classes) => {
        el._x_transition.enter.start = classes;
      },
      "enter-end": (classes) => {
        el._x_transition.enter.end = classes;
      },
      "leave": (classes) => {
        el._x_transition.leave.during = classes;
      },
      "leave-start": (classes) => {
        el._x_transition.leave.start = classes;
      },
      "leave-end": (classes) => {
        el._x_transition.leave.end = classes;
      }
    };
    directiveStorageMap[stage](classString);
  }
  function registerTransitionsFromHelper(el, modifiers, stage) {
    registerTransitionObject(el, setStyles);
    let doesntSpecify = !modifiers.includes("in") && !modifiers.includes("out") && !stage;
    let transitioningIn = doesntSpecify || modifiers.includes("in") || ["enter"].includes(stage);
    let transitioningOut = doesntSpecify || modifiers.includes("out") || ["leave"].includes(stage);
    if (modifiers.includes("in") && !doesntSpecify) {
      modifiers = modifiers.filter((i, index) => index < modifiers.indexOf("out"));
    }
    if (modifiers.includes("out") && !doesntSpecify) {
      modifiers = modifiers.filter((i, index) => index > modifiers.indexOf("out"));
    }
    let wantsAll = !modifiers.includes("opacity") && !modifiers.includes("scale");
    let wantsOpacity = wantsAll || modifiers.includes("opacity");
    let wantsScale = wantsAll || modifiers.includes("scale");
    let opacityValue = wantsOpacity ? 0 : 1;
    let scaleValue = wantsScale ? modifierValue(modifiers, "scale", 95) / 100 : 1;
    let delay = modifierValue(modifiers, "delay", 0) / 1e3;
    let origin = modifierValue(modifiers, "origin", "center");
    let property = "opacity, transform";
    let durationIn = modifierValue(modifiers, "duration", 150) / 1e3;
    let durationOut = modifierValue(modifiers, "duration", 75) / 1e3;
    let easing = `cubic-bezier(0.4, 0.0, 0.2, 1)`;
    if (transitioningIn) {
      el._x_transition.enter.during = {
        transformOrigin: origin,
        transitionDelay: `${delay}s`,
        transitionProperty: property,
        transitionDuration: `${durationIn}s`,
        transitionTimingFunction: easing
      };
      el._x_transition.enter.start = {
        opacity: opacityValue,
        transform: `scale(${scaleValue})`
      };
      el._x_transition.enter.end = {
        opacity: 1,
        transform: `scale(1)`
      };
    }
    if (transitioningOut) {
      el._x_transition.leave.during = {
        transformOrigin: origin,
        transitionDelay: `${delay}s`,
        transitionProperty: property,
        transitionDuration: `${durationOut}s`,
        transitionTimingFunction: easing
      };
      el._x_transition.leave.start = {
        opacity: 1,
        transform: `scale(1)`
      };
      el._x_transition.leave.end = {
        opacity: opacityValue,
        transform: `scale(${scaleValue})`
      };
    }
  }
  function registerTransitionObject(el, setFunction, defaultValue = {}) {
    if (!el._x_transition)
      el._x_transition = {
        enter: { during: defaultValue, start: defaultValue, end: defaultValue },
        leave: { during: defaultValue, start: defaultValue, end: defaultValue },
        in(before = () => {
        }, after = () => {
        }) {
          transition(el, setFunction, {
            during: this.enter.during,
            start: this.enter.start,
            end: this.enter.end
          }, before, after);
        },
        out(before = () => {
        }, after = () => {
        }) {
          transition(el, setFunction, {
            during: this.leave.during,
            start: this.leave.start,
            end: this.leave.end
          }, before, after);
        }
      };
  }
  window.Element.prototype._x_toggleAndCascadeWithTransitions = function(el, value, show, hide) {
    const nextTick2 = document.visibilityState === "visible" ? requestAnimationFrame : setTimeout;
    let clickAwayCompatibleShow = () => nextTick2(show);
    if (value) {
      if (el._x_transition && (el._x_transition.enter || el._x_transition.leave)) {
        el._x_transition.enter && (Object.entries(el._x_transition.enter.during).length || Object.entries(el._x_transition.enter.start).length || Object.entries(el._x_transition.enter.end).length) ? el._x_transition.in(show) : clickAwayCompatibleShow();
      } else {
        el._x_transition ? el._x_transition.in(show) : clickAwayCompatibleShow();
      }
      return;
    }
    el._x_hidePromise = el._x_transition ? new Promise((resolve, reject) => {
      el._x_transition.out(() => {
      }, () => resolve(hide));
      el._x_transitioning && el._x_transitioning.beforeCancel(() => reject({ isFromCancelledTransition: true }));
    }) : Promise.resolve(hide);
    queueMicrotask(() => {
      let closest = closestHide(el);
      if (closest) {
        if (!closest._x_hideChildren)
          closest._x_hideChildren = [];
        closest._x_hideChildren.push(el);
      } else {
        nextTick2(() => {
          let hideAfterChildren = (el2) => {
            let carry = Promise.all([
              el2._x_hidePromise,
              ...(el2._x_hideChildren || []).map(hideAfterChildren)
            ]).then(([i]) => i());
            delete el2._x_hidePromise;
            delete el2._x_hideChildren;
            return carry;
          };
          hideAfterChildren(el).catch((e) => {
            if (!e.isFromCancelledTransition)
              throw e;
          });
        });
      }
    });
  };
  function closestHide(el) {
    let parent = el.parentNode;
    if (!parent)
      return;
    return parent._x_hidePromise ? parent : closestHide(parent);
  }
  function transition(el, setFunction, { during, start: start2, end } = {}, before = () => {
  }, after = () => {
  }) {
    if (el._x_transitioning)
      el._x_transitioning.cancel();
    if (Object.keys(during).length === 0 && Object.keys(start2).length === 0 && Object.keys(end).length === 0) {
      before();
      after();
      return;
    }
    let undoStart, undoDuring, undoEnd;
    performTransition(el, {
      start() {
        undoStart = setFunction(el, start2);
      },
      during() {
        undoDuring = setFunction(el, during);
      },
      before,
      end() {
        undoStart();
        undoEnd = setFunction(el, end);
      },
      after,
      cleanup() {
        undoDuring();
        undoEnd();
      }
    });
  }
  function performTransition(el, stages) {
    let interrupted, reachedBefore, reachedEnd;
    let finish = once(() => {
      mutateDom(() => {
        interrupted = true;
        if (!reachedBefore)
          stages.before();
        if (!reachedEnd) {
          stages.end();
          releaseNextTicks();
        }
        stages.after();
        if (el.isConnected)
          stages.cleanup();
        delete el._x_transitioning;
      });
    });
    el._x_transitioning = {
      beforeCancels: [],
      beforeCancel(callback) {
        this.beforeCancels.push(callback);
      },
      cancel: once(function() {
        while (this.beforeCancels.length) {
          this.beforeCancels.shift()();
        }
        ;
        finish();
      }),
      finish
    };
    mutateDom(() => {
      stages.start();
      stages.during();
    });
    holdNextTicks();
    requestAnimationFrame(() => {
      if (interrupted)
        return;
      let duration = Number(getComputedStyle(el).transitionDuration.replace(/,.*/, "").replace("s", "")) * 1e3;
      let delay = Number(getComputedStyle(el).transitionDelay.replace(/,.*/, "").replace("s", "")) * 1e3;
      if (duration === 0)
        duration = Number(getComputedStyle(el).animationDuration.replace("s", "")) * 1e3;
      mutateDom(() => {
        stages.before();
      });
      reachedBefore = true;
      requestAnimationFrame(() => {
        if (interrupted)
          return;
        mutateDom(() => {
          stages.end();
        });
        releaseNextTicks();
        setTimeout(el._x_transitioning.finish, duration + delay);
        reachedEnd = true;
      });
    });
  }
  function modifierValue(modifiers, key, fallback) {
    if (modifiers.indexOf(key) === -1)
      return fallback;
    const rawValue = modifiers[modifiers.indexOf(key) + 1];
    if (!rawValue)
      return fallback;
    if (key === "scale") {
      if (isNaN(rawValue))
        return fallback;
    }
    if (key === "duration" || key === "delay") {
      let match = rawValue.match(/([0-9]+)ms/);
      if (match)
        return match[1];
    }
    if (key === "origin") {
      if (["top", "right", "left", "center", "bottom"].includes(modifiers[modifiers.indexOf(key) + 2])) {
        return [rawValue, modifiers[modifiers.indexOf(key) + 2]].join(" ");
      }
    }
    return rawValue;
  }
  var isCloning = false;
  function skipDuringClone(callback, fallback = () => {
  }) {
    return (...args) => isCloning ? fallback(...args) : callback(...args);
  }
  function onlyDuringClone(callback) {
    return (...args) => isCloning && callback(...args);
  }
  var interceptors = [];
  function interceptClone(callback) {
    interceptors.push(callback);
  }
  function cloneNode(from, to) {
    interceptors.forEach((i) => i(from, to));
    isCloning = true;
    dontRegisterReactiveSideEffects(() => {
      initTree(to, (el, callback) => {
        callback(el, () => {
        });
      });
    });
    isCloning = false;
  }
  var isCloningLegacy = false;
  function clone(oldEl, newEl) {
    if (!newEl._x_dataStack)
      newEl._x_dataStack = oldEl._x_dataStack;
    isCloning = true;
    isCloningLegacy = true;
    dontRegisterReactiveSideEffects(() => {
      cloneTree(newEl);
    });
    isCloning = false;
    isCloningLegacy = false;
  }
  function cloneTree(el) {
    let hasRunThroughFirstEl = false;
    let shallowWalker = (el2, callback) => {
      walk(el2, (el3, skip) => {
        if (hasRunThroughFirstEl && isRoot(el3))
          return skip();
        hasRunThroughFirstEl = true;
        callback(el3, skip);
      });
    };
    initTree(el, shallowWalker);
  }
  function dontRegisterReactiveSideEffects(callback) {
    let cache = effect;
    overrideEffect((callback2, el) => {
      let storedEffect = cache(callback2);
      release(storedEffect);
      return () => {
      };
    });
    callback();
    overrideEffect(cache);
  }
  function bind(el, name, value, modifiers = []) {
    if (!el._x_bindings)
      el._x_bindings = reactive({});
    el._x_bindings[name] = value;
    name = modifiers.includes("camel") ? camelCase(name) : name;
    switch (name) {
      case "value":
        bindInputValue(el, value);
        break;
      case "style":
        bindStyles(el, value);
        break;
      case "class":
        bindClasses(el, value);
        break;
      case "selected":
      case "checked":
        bindAttributeAndProperty(el, name, value);
        break;
      default:
        bindAttribute(el, name, value);
        break;
    }
  }
  function bindInputValue(el, value) {
    if (el.type === "radio") {
      if (el.attributes.value === void 0) {
        el.value = value;
      }
      if (window.fromModel) {
        if (typeof value === "boolean") {
          el.checked = safeParseBoolean(el.value) === value;
        } else {
          el.checked = checkedAttrLooseCompare(el.value, value);
        }
      }
    } else if (el.type === "checkbox") {
      if (Number.isInteger(value)) {
        el.value = value;
      } else if (!Array.isArray(value) && typeof value !== "boolean" && ![null, void 0].includes(value)) {
        el.value = String(value);
      } else {
        if (Array.isArray(value)) {
          el.checked = value.some((val) => checkedAttrLooseCompare(val, el.value));
        } else {
          el.checked = !!value;
        }
      }
    } else if (el.tagName === "SELECT") {
      updateSelect(el, value);
    } else {
      if (el.value === value)
        return;
      el.value = value === void 0 ? "" : value;
    }
  }
  function bindClasses(el, value) {
    if (el._x_undoAddedClasses)
      el._x_undoAddedClasses();
    el._x_undoAddedClasses = setClasses(el, value);
  }
  function bindStyles(el, value) {
    if (el._x_undoAddedStyles)
      el._x_undoAddedStyles();
    el._x_undoAddedStyles = setStyles(el, value);
  }
  function bindAttributeAndProperty(el, name, value) {
    bindAttribute(el, name, value);
    setPropertyIfChanged(el, name, value);
  }
  function bindAttribute(el, name, value) {
    if ([null, void 0, false].includes(value) && attributeShouldntBePreservedIfFalsy(name)) {
      el.removeAttribute(name);
    } else {
      if (isBooleanAttr(name))
        value = name;
      setIfChanged(el, name, value);
    }
  }
  function setIfChanged(el, attrName, value) {
    if (el.getAttribute(attrName) != value) {
      el.setAttribute(attrName, value);
    }
  }
  function setPropertyIfChanged(el, propName, value) {
    if (el[propName] !== value) {
      el[propName] = value;
    }
  }
  function updateSelect(el, value) {
    const arrayWrappedValue = [].concat(value).map((value2) => {
      return value2 + "";
    });
    Array.from(el.options).forEach((option) => {
      option.selected = arrayWrappedValue.includes(option.value);
    });
  }
  function camelCase(subject) {
    return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
  }
  function checkedAttrLooseCompare(valueA, valueB) {
    return valueA == valueB;
  }
  function safeParseBoolean(rawValue) {
    if ([1, "1", "true", "on", "yes", true].includes(rawValue)) {
      return true;
    }
    if ([0, "0", "false", "off", "no", false].includes(rawValue)) {
      return false;
    }
    return rawValue ? Boolean(rawValue) : null;
  }
  function isBooleanAttr(attrName) {
    const booleanAttributes = [
      "disabled",
      "checked",
      "required",
      "readonly",
      "hidden",
      "open",
      "selected",
      "autofocus",
      "itemscope",
      "multiple",
      "novalidate",
      "allowfullscreen",
      "allowpaymentrequest",
      "formnovalidate",
      "autoplay",
      "controls",
      "loop",
      "muted",
      "playsinline",
      "default",
      "ismap",
      "reversed",
      "async",
      "defer",
      "nomodule"
    ];
    return booleanAttributes.includes(attrName);
  }
  function attributeShouldntBePreservedIfFalsy(name) {
    return !["aria-pressed", "aria-checked", "aria-expanded", "aria-selected"].includes(name);
  }
  function getBinding(el, name, fallback) {
    if (el._x_bindings && el._x_bindings[name] !== void 0)
      return el._x_bindings[name];
    return getAttributeBinding(el, name, fallback);
  }
  function extractProp(el, name, fallback, extract = true) {
    if (el._x_bindings && el._x_bindings[name] !== void 0)
      return el._x_bindings[name];
    if (el._x_inlineBindings && el._x_inlineBindings[name] !== void 0) {
      let binding = el._x_inlineBindings[name];
      binding.extract = extract;
      return dontAutoEvaluateFunctions(() => {
        return evaluate(el, binding.expression);
      });
    }
    return getAttributeBinding(el, name, fallback);
  }
  function getAttributeBinding(el, name, fallback) {
    let attr = el.getAttribute(name);
    if (attr === null)
      return typeof fallback === "function" ? fallback() : fallback;
    if (attr === "")
      return true;
    if (isBooleanAttr(name)) {
      return !![name, "true"].includes(attr);
    }
    return attr;
  }
  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  function throttle(func, limit) {
    let inThrottle;
    return function() {
      let context = this, args = arguments;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  function entangle({ get: outerGet, set: outerSet }, { get: innerGet, set: innerSet }) {
    let firstRun = true;
    let outerHash;
    let innerHash;
    let reference = effect(() => {
      let outer = outerGet();
      let inner = innerGet();
      if (firstRun) {
        innerSet(cloneIfObject(outer));
        firstRun = false;
      } else {
        let outerHashLatest = JSON.stringify(outer);
        let innerHashLatest = JSON.stringify(inner);
        if (outerHashLatest !== outerHash) {
          innerSet(cloneIfObject(outer));
        } else if (outerHashLatest !== innerHashLatest) {
          outerSet(cloneIfObject(inner));
        } else {
        }
      }
      outerHash = JSON.stringify(outerGet());
      innerHash = JSON.stringify(innerGet());
    });
    return () => {
      release(reference);
    };
  }
  function cloneIfObject(value) {
    return typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }
  function plugin(callback) {
    let callbacks = Array.isArray(callback) ? callback : [callback];
    callbacks.forEach((i) => i(alpine_default));
  }
  var stores = {};
  var isReactive = false;
  function store(name, value) {
    if (!isReactive) {
      stores = reactive(stores);
      isReactive = true;
    }
    if (value === void 0) {
      return stores[name];
    }
    stores[name] = value;
    if (typeof value === "object" && value !== null && value.hasOwnProperty("init") && typeof value.init === "function") {
      stores[name].init();
    }
    initInterceptors2(stores[name]);
  }
  function getStores() {
    return stores;
  }
  var binds = {};
  function bind2(name, bindings) {
    let getBindings = typeof bindings !== "function" ? () => bindings : bindings;
    if (name instanceof Element) {
      return applyBindingsObject(name, getBindings());
    } else {
      binds[name] = getBindings;
    }
    return () => {
    };
  }
  function injectBindingProviders(obj) {
    Object.entries(binds).forEach(([name, callback]) => {
      Object.defineProperty(obj, name, {
        get() {
          return (...args) => {
            return callback(...args);
          };
        }
      });
    });
    return obj;
  }
  function applyBindingsObject(el, obj, original) {
    let cleanupRunners = [];
    while (cleanupRunners.length)
      cleanupRunners.pop()();
    let attributes = Object.entries(obj).map(([name, value]) => ({ name, value }));
    let staticAttributes = attributesOnly(attributes);
    attributes = attributes.map((attribute) => {
      if (staticAttributes.find((attr) => attr.name === attribute.name)) {
        return {
          name: `x-bind:${attribute.name}`,
          value: `"${attribute.value}"`
        };
      }
      return attribute;
    });
    directives(el, attributes, original).map((handle) => {
      cleanupRunners.push(handle.runCleanups);
      handle();
    });
    return () => {
      while (cleanupRunners.length)
        cleanupRunners.pop()();
    };
  }
  var datas = {};
  function data(name, callback) {
    datas[name] = callback;
  }
  function injectDataProviders(obj, context) {
    Object.entries(datas).forEach(([name, callback]) => {
      Object.defineProperty(obj, name, {
        get() {
          return (...args) => {
            return callback.bind(context)(...args);
          };
        },
        enumerable: false
      });
    });
    return obj;
  }
  var Alpine = {
    get reactive() {
      return reactive;
    },
    get release() {
      return release;
    },
    get effect() {
      return effect;
    },
    get raw() {
      return raw;
    },
    version: "3.13.7",
    flushAndStopDeferringMutations,
    dontAutoEvaluateFunctions,
    disableEffectScheduling,
    startObservingMutations,
    stopObservingMutations,
    setReactivityEngine,
    onAttributeRemoved,
    onAttributesAdded,
    closestDataStack,
    skipDuringClone,
    onlyDuringClone,
    addRootSelector,
    addInitSelector,
    interceptClone,
    addScopeToNode,
    deferMutations,
    mapAttributes,
    evaluateLater,
    interceptInit,
    setEvaluator,
    mergeProxies,
    extractProp,
    findClosest,
    onElRemoved,
    closestRoot,
    destroyTree,
    interceptor,
    transition,
    setStyles,
    mutateDom,
    directive,
    entangle,
    throttle,
    debounce,
    evaluate,
    initTree,
    nextTick,
    prefixed: prefix,
    prefix: setPrefix,
    plugin,
    magic,
    store,
    start,
    clone,
    cloneNode,
    bound: getBinding,
    $data: scope,
    watch,
    walk,
    data,
    bind: bind2
  };
  var alpine_default = Alpine;
  function makeMap(str, expectsLowerCase) {
    const map = /* @__PURE__ */ Object.create(null);
    const list = str.split(",");
    for (let i = 0; i < list.length; i++) {
      map[list[i]] = true;
    }
    return expectsLowerCase ? (val) => !!map[val.toLowerCase()] : (val) => !!map[val];
  }
  var specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
  var isBooleanAttr2 = /* @__PURE__ */ makeMap(specialBooleanAttrs + `,async,autofocus,autoplay,controls,default,defer,disabled,hidden,loop,open,required,reversed,scoped,seamless,checked,muted,multiple,selected`);
  var EMPTY_OBJ = true ? Object.freeze({}) : {};
  var EMPTY_ARR = true ? Object.freeze([]) : [];
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasOwn = (val, key) => hasOwnProperty.call(val, key);
  var isArray = Array.isArray;
  var isMap = (val) => toTypeString(val) === "[object Map]";
  var isString = (val) => typeof val === "string";
  var isSymbol = (val) => typeof val === "symbol";
  var isObject = (val) => val !== null && typeof val === "object";
  var objectToString = Object.prototype.toString;
  var toTypeString = (value) => objectToString.call(value);
  var toRawType = (value) => {
    return toTypeString(value).slice(8, -1);
  };
  var isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
  var cacheStringFunction = (fn) => {
    const cache = /* @__PURE__ */ Object.create(null);
    return (str) => {
      const hit = cache[str];
      return hit || (cache[str] = fn(str));
    };
  };
  var camelizeRE = /-(\w)/g;
  var camelize = cacheStringFunction((str) => {
    return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : "");
  });
  var hyphenateRE = /\B([A-Z])/g;
  var hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, "-$1").toLowerCase());
  var capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1));
  var toHandlerKey = cacheStringFunction((str) => str ? `on${capitalize(str)}` : ``);
  var hasChanged = (value, oldValue) => value !== oldValue && (value === value || oldValue === oldValue);
  var targetMap = /* @__PURE__ */ new WeakMap();
  var effectStack = [];
  var activeEffect;
  var ITERATE_KEY = Symbol(true ? "iterate" : "");
  var MAP_KEY_ITERATE_KEY = Symbol(true ? "Map key iterate" : "");
  function isEffect(fn) {
    return fn && fn._isEffect === true;
  }
  function effect2(fn, options = EMPTY_OBJ) {
    if (isEffect(fn)) {
      fn = fn.raw;
    }
    const effect3 = createReactiveEffect(fn, options);
    if (!options.lazy) {
      effect3();
    }
    return effect3;
  }
  function stop(effect3) {
    if (effect3.active) {
      cleanup(effect3);
      if (effect3.options.onStop) {
        effect3.options.onStop();
      }
      effect3.active = false;
    }
  }
  var uid = 0;
  function createReactiveEffect(fn, options) {
    const effect3 = function reactiveEffect() {
      if (!effect3.active) {
        return fn();
      }
      if (!effectStack.includes(effect3)) {
        cleanup(effect3);
        try {
          enableTracking();
          effectStack.push(effect3);
          activeEffect = effect3;
          return fn();
        } finally {
          effectStack.pop();
          resetTracking();
          activeEffect = effectStack[effectStack.length - 1];
        }
      }
    };
    effect3.id = uid++;
    effect3.allowRecurse = !!options.allowRecurse;
    effect3._isEffect = true;
    effect3.active = true;
    effect3.raw = fn;
    effect3.deps = [];
    effect3.options = options;
    return effect3;
  }
  function cleanup(effect3) {
    const { deps } = effect3;
    if (deps.length) {
      for (let i = 0; i < deps.length; i++) {
        deps[i].delete(effect3);
      }
      deps.length = 0;
    }
  }
  var shouldTrack = true;
  var trackStack = [];
  function pauseTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = false;
  }
  function enableTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = true;
  }
  function resetTracking() {
    const last = trackStack.pop();
    shouldTrack = last === void 0 ? true : last;
  }
  function track(target, type, key) {
    if (!shouldTrack || activeEffect === void 0) {
      return;
    }
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = /* @__PURE__ */ new Set());
    }
    if (!dep.has(activeEffect)) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep);
      if (activeEffect.options.onTrack) {
        activeEffect.options.onTrack({
          effect: activeEffect,
          target,
          type,
          key
        });
      }
    }
  }
  function trigger(target, type, key, newValue, oldValue, oldTarget) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
      return;
    }
    const effects = /* @__PURE__ */ new Set();
    const add2 = (effectsToAdd) => {
      if (effectsToAdd) {
        effectsToAdd.forEach((effect3) => {
          if (effect3 !== activeEffect || effect3.allowRecurse) {
            effects.add(effect3);
          }
        });
      }
    };
    if (type === "clear") {
      depsMap.forEach(add2);
    } else if (key === "length" && isArray(target)) {
      depsMap.forEach((dep, key2) => {
        if (key2 === "length" || key2 >= newValue) {
          add2(dep);
        }
      });
    } else {
      if (key !== void 0) {
        add2(depsMap.get(key));
      }
      switch (type) {
        case "add":
          if (!isArray(target)) {
            add2(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              add2(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          } else if (isIntegerKey(key)) {
            add2(depsMap.get("length"));
          }
          break;
        case "delete":
          if (!isArray(target)) {
            add2(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              add2(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          }
          break;
        case "set":
          if (isMap(target)) {
            add2(depsMap.get(ITERATE_KEY));
          }
          break;
      }
    }
    const run = (effect3) => {
      if (effect3.options.onTrigger) {
        effect3.options.onTrigger({
          effect: effect3,
          target,
          key,
          type,
          newValue,
          oldValue,
          oldTarget
        });
      }
      if (effect3.options.scheduler) {
        effect3.options.scheduler(effect3);
      } else {
        effect3();
      }
    };
    effects.forEach(run);
  }
  var isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
  var builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol).map((key) => Symbol[key]).filter(isSymbol));
  var get2 = /* @__PURE__ */ createGetter();
  var readonlyGet = /* @__PURE__ */ createGetter(true);
  var arrayInstrumentations = /* @__PURE__ */ createArrayInstrumentations();
  function createArrayInstrumentations() {
    const instrumentations = {};
    ["includes", "indexOf", "lastIndexOf"].forEach((key) => {
      instrumentations[key] = function(...args) {
        const arr = toRaw(this);
        for (let i = 0, l = this.length; i < l; i++) {
          track(arr, "get", i + "");
        }
        const res = arr[key](...args);
        if (res === -1 || res === false) {
          return arr[key](...args.map(toRaw));
        } else {
          return res;
        }
      };
    });
    ["push", "pop", "shift", "unshift", "splice"].forEach((key) => {
      instrumentations[key] = function(...args) {
        pauseTracking();
        const res = toRaw(this)[key].apply(this, args);
        resetTracking();
        return res;
      };
    });
    return instrumentations;
  }
  function createGetter(isReadonly = false, shallow = false) {
    return function get3(target, key, receiver) {
      if (key === "__v_isReactive") {
        return !isReadonly;
      } else if (key === "__v_isReadonly") {
        return isReadonly;
      } else if (key === "__v_raw" && receiver === (isReadonly ? shallow ? shallowReadonlyMap : readonlyMap : shallow ? shallowReactiveMap : reactiveMap).get(target)) {
        return target;
      }
      const targetIsArray = isArray(target);
      if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
        return Reflect.get(arrayInstrumentations, key, receiver);
      }
      const res = Reflect.get(target, key, receiver);
      if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
        return res;
      }
      if (!isReadonly) {
        track(target, "get", key);
      }
      if (shallow) {
        return res;
      }
      if (isRef(res)) {
        const shouldUnwrap = !targetIsArray || !isIntegerKey(key);
        return shouldUnwrap ? res.value : res;
      }
      if (isObject(res)) {
        return isReadonly ? readonly(res) : reactive2(res);
      }
      return res;
    };
  }
  var set2 = /* @__PURE__ */ createSetter();
  function createSetter(shallow = false) {
    return function set3(target, key, value, receiver) {
      let oldValue = target[key];
      if (!shallow) {
        value = toRaw(value);
        oldValue = toRaw(oldValue);
        if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
          oldValue.value = value;
          return true;
        }
      }
      const hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
      const result = Reflect.set(target, key, value, receiver);
      if (target === toRaw(receiver)) {
        if (!hadKey) {
          trigger(target, "add", key, value);
        } else if (hasChanged(value, oldValue)) {
          trigger(target, "set", key, value, oldValue);
        }
      }
      return result;
    };
  }
  function deleteProperty(target, key) {
    const hadKey = hasOwn(target, key);
    const oldValue = target[key];
    const result = Reflect.deleteProperty(target, key);
    if (result && hadKey) {
      trigger(target, "delete", key, void 0, oldValue);
    }
    return result;
  }
  function has(target, key) {
    const result = Reflect.has(target, key);
    if (!isSymbol(key) || !builtInSymbols.has(key)) {
      track(target, "has", key);
    }
    return result;
  }
  function ownKeys(target) {
    track(target, "iterate", isArray(target) ? "length" : ITERATE_KEY);
    return Reflect.ownKeys(target);
  }
  var mutableHandlers = {
    get: get2,
    set: set2,
    deleteProperty,
    has,
    ownKeys
  };
  var readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
      if (true) {
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
      }
      return true;
    },
    deleteProperty(target, key) {
      if (true) {
        console.warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target);
      }
      return true;
    }
  };
  var toReactive = (value) => isObject(value) ? reactive2(value) : value;
  var toReadonly = (value) => isObject(value) ? readonly(value) : value;
  var toShallow = (value) => value;
  var getProto = (v) => Reflect.getPrototypeOf(v);
  function get$1(target, key, isReadonly = false, isShallow = false) {
    target = target["__v_raw"];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (key !== rawKey) {
      !isReadonly && track(rawTarget, "get", key);
    }
    !isReadonly && track(rawTarget, "get", rawKey);
    const { has: has2 } = getProto(rawTarget);
    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
    if (has2.call(rawTarget, key)) {
      return wrap(target.get(key));
    } else if (has2.call(rawTarget, rawKey)) {
      return wrap(target.get(rawKey));
    } else if (target !== rawTarget) {
      target.get(key);
    }
  }
  function has$1(key, isReadonly = false) {
    const target = this["__v_raw"];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (key !== rawKey) {
      !isReadonly && track(rawTarget, "has", key);
    }
    !isReadonly && track(rawTarget, "has", rawKey);
    return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
  }
  function size(target, isReadonly = false) {
    target = target["__v_raw"];
    !isReadonly && track(toRaw(target), "iterate", ITERATE_KEY);
    return Reflect.get(target, "size", target);
  }
  function add(value) {
    value = toRaw(value);
    const target = toRaw(this);
    const proto = getProto(target);
    const hadKey = proto.has.call(target, value);
    if (!hadKey) {
      target.add(value);
      trigger(target, "add", value, value);
    }
    return this;
  }
  function set$1(key, value) {
    value = toRaw(value);
    const target = toRaw(this);
    const { has: has2, get: get3 } = getProto(target);
    let hadKey = has2.call(target, key);
    if (!hadKey) {
      key = toRaw(key);
      hadKey = has2.call(target, key);
    } else if (true) {
      checkIdentityKeys(target, has2, key);
    }
    const oldValue = get3.call(target, key);
    target.set(key, value);
    if (!hadKey) {
      trigger(target, "add", key, value);
    } else if (hasChanged(value, oldValue)) {
      trigger(target, "set", key, value, oldValue);
    }
    return this;
  }
  function deleteEntry(key) {
    const target = toRaw(this);
    const { has: has2, get: get3 } = getProto(target);
    let hadKey = has2.call(target, key);
    if (!hadKey) {
      key = toRaw(key);
      hadKey = has2.call(target, key);
    } else if (true) {
      checkIdentityKeys(target, has2, key);
    }
    const oldValue = get3 ? get3.call(target, key) : void 0;
    const result = target.delete(key);
    if (hadKey) {
      trigger(target, "delete", key, void 0, oldValue);
    }
    return result;
  }
  function clear() {
    const target = toRaw(this);
    const hadItems = target.size !== 0;
    const oldTarget = true ? isMap(target) ? new Map(target) : new Set(target) : void 0;
    const result = target.clear();
    if (hadItems) {
      trigger(target, "clear", void 0, void 0, oldTarget);
    }
    return result;
  }
  function createForEach(isReadonly, isShallow) {
    return function forEach(callback, thisArg) {
      const observed = this;
      const target = observed["__v_raw"];
      const rawTarget = toRaw(target);
      const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
      !isReadonly && track(rawTarget, "iterate", ITERATE_KEY);
      return target.forEach((value, key) => {
        return callback.call(thisArg, wrap(value), wrap(key), observed);
      });
    };
  }
  function createIterableMethod(method, isReadonly, isShallow) {
    return function(...args) {
      const target = this["__v_raw"];
      const rawTarget = toRaw(target);
      const targetIsMap = isMap(rawTarget);
      const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
      const isKeyOnly = method === "keys" && targetIsMap;
      const innerIterator = target[method](...args);
      const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
      !isReadonly && track(rawTarget, "iterate", isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
      return {
        next() {
          const { value, done } = innerIterator.next();
          return done ? { value, done } : {
            value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
            done
          };
        },
        [Symbol.iterator]() {
          return this;
        }
      };
    };
  }
  function createReadonlyMethod(type) {
    return function(...args) {
      if (true) {
        const key = args[0] ? `on key "${args[0]}" ` : ``;
        console.warn(`${capitalize(type)} operation ${key}failed: target is readonly.`, toRaw(this));
      }
      return type === "delete" ? false : this;
    };
  }
  function createInstrumentations() {
    const mutableInstrumentations2 = {
      get(key) {
        return get$1(this, key);
      },
      get size() {
        return size(this);
      },
      has: has$1,
      add,
      set: set$1,
      delete: deleteEntry,
      clear,
      forEach: createForEach(false, false)
    };
    const shallowInstrumentations2 = {
      get(key) {
        return get$1(this, key, false, true);
      },
      get size() {
        return size(this);
      },
      has: has$1,
      add,
      set: set$1,
      delete: deleteEntry,
      clear,
      forEach: createForEach(false, true)
    };
    const readonlyInstrumentations2 = {
      get(key) {
        return get$1(this, key, true);
      },
      get size() {
        return size(this, true);
      },
      has(key) {
        return has$1.call(this, key, true);
      },
      add: createReadonlyMethod(
        "add"
      ),
      set: createReadonlyMethod(
        "set"
      ),
      delete: createReadonlyMethod(
        "delete"
      ),
      clear: createReadonlyMethod(
        "clear"
      ),
      forEach: createForEach(true, false)
    };
    const shallowReadonlyInstrumentations2 = {
      get(key) {
        return get$1(this, key, true, true);
      },
      get size() {
        return size(this, true);
      },
      has(key) {
        return has$1.call(this, key, true);
      },
      add: createReadonlyMethod(
        "add"
      ),
      set: createReadonlyMethod(
        "set"
      ),
      delete: createReadonlyMethod(
        "delete"
      ),
      clear: createReadonlyMethod(
        "clear"
      ),
      forEach: createForEach(true, true)
    };
    const iteratorMethods = ["keys", "values", "entries", Symbol.iterator];
    iteratorMethods.forEach((method) => {
      mutableInstrumentations2[method] = createIterableMethod(method, false, false);
      readonlyInstrumentations2[method] = createIterableMethod(method, true, false);
      shallowInstrumentations2[method] = createIterableMethod(method, false, true);
      shallowReadonlyInstrumentations2[method] = createIterableMethod(method, true, true);
    });
    return [
      mutableInstrumentations2,
      readonlyInstrumentations2,
      shallowInstrumentations2,
      shallowReadonlyInstrumentations2
    ];
  }
  var [mutableInstrumentations, readonlyInstrumentations, shallowInstrumentations, shallowReadonlyInstrumentations] = /* @__PURE__ */ createInstrumentations();
  function createInstrumentationGetter(isReadonly, shallow) {
    const instrumentations = shallow ? isReadonly ? shallowReadonlyInstrumentations : shallowInstrumentations : isReadonly ? readonlyInstrumentations : mutableInstrumentations;
    return (target, key, receiver) => {
      if (key === "__v_isReactive") {
        return !isReadonly;
      } else if (key === "__v_isReadonly") {
        return isReadonly;
      } else if (key === "__v_raw") {
        return target;
      }
      return Reflect.get(hasOwn(instrumentations, key) && key in target ? instrumentations : target, key, receiver);
    };
  }
  var mutableCollectionHandlers = {
    get: /* @__PURE__ */ createInstrumentationGetter(false, false)
  };
  var readonlyCollectionHandlers = {
    get: /* @__PURE__ */ createInstrumentationGetter(true, false)
  };
  function checkIdentityKeys(target, has2, key) {
    const rawKey = toRaw(key);
    if (rawKey !== key && has2.call(target, rawKey)) {
      const type = toRawType(target);
      console.warn(`Reactive ${type} contains both the raw and reactive versions of the same object${type === `Map` ? ` as keys` : ``}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`);
    }
  }
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  var shallowReactiveMap = /* @__PURE__ */ new WeakMap();
  var readonlyMap = /* @__PURE__ */ new WeakMap();
  var shallowReadonlyMap = /* @__PURE__ */ new WeakMap();
  function targetTypeMap(rawType) {
    switch (rawType) {
      case "Object":
      case "Array":
        return 1;
      case "Map":
      case "Set":
      case "WeakMap":
      case "WeakSet":
        return 2;
      default:
        return 0;
    }
  }
  function getTargetType(value) {
    return value["__v_skip"] || !Object.isExtensible(value) ? 0 : targetTypeMap(toRawType(value));
  }
  function reactive2(target) {
    if (target && target["__v_isReadonly"]) {
      return target;
    }
    return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
  }
  function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
  }
  function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers, proxyMap) {
    if (!isObject(target)) {
      if (true) {
        console.warn(`value cannot be made reactive: ${String(target)}`);
      }
      return target;
    }
    if (target["__v_raw"] && !(isReadonly && target["__v_isReactive"])) {
      return target;
    }
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
      return existingProxy;
    }
    const targetType = getTargetType(target);
    if (targetType === 0) {
      return target;
    }
    const proxy = new Proxy(target, targetType === 2 ? collectionHandlers : baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
  }
  function toRaw(observed) {
    return observed && toRaw(observed["__v_raw"]) || observed;
  }
  function isRef(r) {
    return Boolean(r && r.__v_isRef === true);
  }
  magic("nextTick", () => nextTick);
  magic("dispatch", (el) => dispatch.bind(dispatch, el));
  magic("watch", (el, { evaluateLater: evaluateLater2, cleanup: cleanup2 }) => (key, callback) => {
    let evaluate2 = evaluateLater2(key);
    let getter = () => {
      let value;
      evaluate2((i) => value = i);
      return value;
    };
    let unwatch = watch(getter, callback);
    cleanup2(unwatch);
  });
  magic("store", getStores);
  magic("data", (el) => scope(el));
  magic("root", (el) => closestRoot(el));
  magic("refs", (el) => {
    if (el._x_refs_proxy)
      return el._x_refs_proxy;
    el._x_refs_proxy = mergeProxies(getArrayOfRefObject(el));
    return el._x_refs_proxy;
  });
  function getArrayOfRefObject(el) {
    let refObjects = [];
    findClosest(el, (i) => {
      if (i._x_refs)
        refObjects.push(i._x_refs);
    });
    return refObjects;
  }
  var globalIdMemo = {};
  function findAndIncrementId(name) {
    if (!globalIdMemo[name])
      globalIdMemo[name] = 0;
    return ++globalIdMemo[name];
  }
  function closestIdRoot(el, name) {
    return findClosest(el, (element) => {
      if (element._x_ids && element._x_ids[name])
        return true;
    });
  }
  function setIdRoot(el, name) {
    if (!el._x_ids)
      el._x_ids = {};
    if (!el._x_ids[name])
      el._x_ids[name] = findAndIncrementId(name);
  }
  magic("id", (el, { cleanup: cleanup2 }) => (name, key = null) => {
    let cacheKey = `${name}${key ? `-${key}` : ""}`;
    return cacheIdByNameOnElement(el, cacheKey, cleanup2, () => {
      let root = closestIdRoot(el, name);
      let id = root ? root._x_ids[name] : findAndIncrementId(name);
      return key ? `${name}-${id}-${key}` : `${name}-${id}`;
    });
  });
  interceptClone((from, to) => {
    if (from._x_id) {
      to._x_id = from._x_id;
    }
  });
  function cacheIdByNameOnElement(el, cacheKey, cleanup2, callback) {
    if (!el._x_id)
      el._x_id = {};
    if (el._x_id[cacheKey])
      return el._x_id[cacheKey];
    let output = callback();
    el._x_id[cacheKey] = output;
    cleanup2(() => {
      delete el._x_id[cacheKey];
    });
    return output;
  }
  magic("el", (el) => el);
  warnMissingPluginMagic("Focus", "focus", "focus");
  warnMissingPluginMagic("Persist", "persist", "persist");
  function warnMissingPluginMagic(name, magicName, slug) {
    magic(magicName, (el) => warn(`You can't use [$${magicName}] without first installing the "${name}" plugin here: https://alpinejs.dev/plugins/${slug}`, el));
  }
  directive("modelable", (el, { expression }, { effect: effect3, evaluateLater: evaluateLater2, cleanup: cleanup2 }) => {
    let func = evaluateLater2(expression);
    let innerGet = () => {
      let result;
      func((i) => result = i);
      return result;
    };
    let evaluateInnerSet = evaluateLater2(`${expression} = __placeholder`);
    let innerSet = (val) => evaluateInnerSet(() => {
    }, { scope: { "__placeholder": val } });
    let initialValue = innerGet();
    innerSet(initialValue);
    queueMicrotask(() => {
      if (!el._x_model)
        return;
      el._x_removeModelListeners["default"]();
      let outerGet = el._x_model.get;
      let outerSet = el._x_model.set;
      let releaseEntanglement = entangle(
        {
          get() {
            return outerGet();
          },
          set(value) {
            outerSet(value);
          }
        },
        {
          get() {
            return innerGet();
          },
          set(value) {
            innerSet(value);
          }
        }
      );
      cleanup2(releaseEntanglement);
    });
  });
  directive("teleport", (el, { modifiers, expression }, { cleanup: cleanup2 }) => {
    if (el.tagName.toLowerCase() !== "template")
      warn("x-teleport can only be used on a <template> tag", el);
    let target = getTarget(expression);
    let clone2 = el.content.cloneNode(true).firstElementChild;
    el._x_teleport = clone2;
    clone2._x_teleportBack = el;
    el.setAttribute("data-teleport-template", true);
    clone2.setAttribute("data-teleport-target", true);
    if (el._x_forwardEvents) {
      el._x_forwardEvents.forEach((eventName) => {
        clone2.addEventListener(eventName, (e) => {
          e.stopPropagation();
          el.dispatchEvent(new e.constructor(e.type, e));
        });
      });
    }
    addScopeToNode(clone2, {}, el);
    let placeInDom = (clone3, target2, modifiers2) => {
      if (modifiers2.includes("prepend")) {
        target2.parentNode.insertBefore(clone3, target2);
      } else if (modifiers2.includes("append")) {
        target2.parentNode.insertBefore(clone3, target2.nextSibling);
      } else {
        target2.appendChild(clone3);
      }
    };
    mutateDom(() => {
      placeInDom(clone2, target, modifiers);
      initTree(clone2);
      clone2._x_ignore = true;
    });
    el._x_teleportPutBack = () => {
      let target2 = getTarget(expression);
      mutateDom(() => {
        placeInDom(el._x_teleport, target2, modifiers);
      });
    };
    cleanup2(() => clone2.remove());
  });
  var teleportContainerDuringClone = document.createElement("div");
  function getTarget(expression) {
    let target = skipDuringClone(() => {
      return document.querySelector(expression);
    }, () => {
      return teleportContainerDuringClone;
    })();
    if (!target)
      warn(`Cannot find x-teleport element for selector: "${expression}"`);
    return target;
  }
  var handler = () => {
  };
  handler.inline = (el, { modifiers }, { cleanup: cleanup2 }) => {
    modifiers.includes("self") ? el._x_ignoreSelf = true : el._x_ignore = true;
    cleanup2(() => {
      modifiers.includes("self") ? delete el._x_ignoreSelf : delete el._x_ignore;
    });
  };
  directive("ignore", handler);
  directive("effect", skipDuringClone((el, { expression }, { effect: effect3 }) => {
    effect3(evaluateLater(el, expression));
  }));
  function on(el, event, modifiers, callback) {
    let listenerTarget = el;
    let handler4 = (e) => callback(e);
    let options = {};
    let wrapHandler = (callback2, wrapper) => (e) => wrapper(callback2, e);
    if (modifiers.includes("dot"))
      event = dotSyntax(event);
    if (modifiers.includes("camel"))
      event = camelCase2(event);
    if (modifiers.includes("passive"))
      options.passive = true;
    if (modifiers.includes("capture"))
      options.capture = true;
    if (modifiers.includes("window"))
      listenerTarget = window;
    if (modifiers.includes("document"))
      listenerTarget = document;
    if (modifiers.includes("debounce")) {
      let nextModifier = modifiers[modifiers.indexOf("debounce") + 1] || "invalid-wait";
      let wait = isNumeric(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
      handler4 = debounce(handler4, wait);
    }
    if (modifiers.includes("throttle")) {
      let nextModifier = modifiers[modifiers.indexOf("throttle") + 1] || "invalid-wait";
      let wait = isNumeric(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
      handler4 = throttle(handler4, wait);
    }
    if (modifiers.includes("prevent"))
      handler4 = wrapHandler(handler4, (next, e) => {
        e.preventDefault();
        next(e);
      });
    if (modifiers.includes("stop"))
      handler4 = wrapHandler(handler4, (next, e) => {
        e.stopPropagation();
        next(e);
      });
    if (modifiers.includes("self"))
      handler4 = wrapHandler(handler4, (next, e) => {
        e.target === el && next(e);
      });
    if (modifiers.includes("away") || modifiers.includes("outside")) {
      listenerTarget = document;
      handler4 = wrapHandler(handler4, (next, e) => {
        if (el.contains(e.target))
          return;
        if (e.target.isConnected === false)
          return;
        if (el.offsetWidth < 1 && el.offsetHeight < 1)
          return;
        if (el._x_isShown === false)
          return;
        next(e);
      });
    }
    if (modifiers.includes("once")) {
      handler4 = wrapHandler(handler4, (next, e) => {
        next(e);
        listenerTarget.removeEventListener(event, handler4, options);
      });
    }
    handler4 = wrapHandler(handler4, (next, e) => {
      if (isKeyEvent(event)) {
        if (isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers)) {
          return;
        }
      }
      next(e);
    });
    listenerTarget.addEventListener(event, handler4, options);
    return () => {
      listenerTarget.removeEventListener(event, handler4, options);
    };
  }
  function dotSyntax(subject) {
    return subject.replace(/-/g, ".");
  }
  function camelCase2(subject) {
    return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
  }
  function isNumeric(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }
  function kebabCase2(subject) {
    if ([" ", "_"].includes(
      subject
    ))
      return subject;
    return subject.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[_\s]/, "-").toLowerCase();
  }
  function isKeyEvent(event) {
    return ["keydown", "keyup"].includes(event);
  }
  function isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers) {
    let keyModifiers = modifiers.filter((i) => {
      return !["window", "document", "prevent", "stop", "once", "capture"].includes(i);
    });
    if (keyModifiers.includes("debounce")) {
      let debounceIndex = keyModifiers.indexOf("debounce");
      keyModifiers.splice(debounceIndex, isNumeric((keyModifiers[debounceIndex + 1] || "invalid-wait").split("ms")[0]) ? 2 : 1);
    }
    if (keyModifiers.includes("throttle")) {
      let debounceIndex = keyModifiers.indexOf("throttle");
      keyModifiers.splice(debounceIndex, isNumeric((keyModifiers[debounceIndex + 1] || "invalid-wait").split("ms")[0]) ? 2 : 1);
    }
    if (keyModifiers.length === 0)
      return false;
    if (keyModifiers.length === 1 && keyToModifiers(e.key).includes(keyModifiers[0]))
      return false;
    const systemKeyModifiers = ["ctrl", "shift", "alt", "meta", "cmd", "super"];
    const selectedSystemKeyModifiers = systemKeyModifiers.filter((modifier) => keyModifiers.includes(modifier));
    keyModifiers = keyModifiers.filter((i) => !selectedSystemKeyModifiers.includes(i));
    if (selectedSystemKeyModifiers.length > 0) {
      const activelyPressedKeyModifiers = selectedSystemKeyModifiers.filter((modifier) => {
        if (modifier === "cmd" || modifier === "super")
          modifier = "meta";
        return e[`${modifier}Key`];
      });
      if (activelyPressedKeyModifiers.length === selectedSystemKeyModifiers.length) {
        if (keyToModifiers(e.key).includes(keyModifiers[0]))
          return false;
      }
    }
    return true;
  }
  function keyToModifiers(key) {
    if (!key)
      return [];
    key = kebabCase2(key);
    let modifierToKeyMap = {
      "ctrl": "control",
      "slash": "/",
      "space": " ",
      "spacebar": " ",
      "cmd": "meta",
      "esc": "escape",
      "up": "arrow-up",
      "down": "arrow-down",
      "left": "arrow-left",
      "right": "arrow-right",
      "period": ".",
      "equal": "=",
      "minus": "-",
      "underscore": "_"
    };
    modifierToKeyMap[key] = key;
    return Object.keys(modifierToKeyMap).map((modifier) => {
      if (modifierToKeyMap[modifier] === key)
        return modifier;
    }).filter((modifier) => modifier);
  }
  directive("model", (el, { modifiers, expression }, { effect: effect3, cleanup: cleanup2 }) => {
    let scopeTarget = el;
    if (modifiers.includes("parent")) {
      scopeTarget = el.parentNode;
    }
    let evaluateGet = evaluateLater(scopeTarget, expression);
    let evaluateSet;
    if (typeof expression === "string") {
      evaluateSet = evaluateLater(scopeTarget, `${expression} = __placeholder`);
    } else if (typeof expression === "function" && typeof expression() === "string") {
      evaluateSet = evaluateLater(scopeTarget, `${expression()} = __placeholder`);
    } else {
      evaluateSet = () => {
      };
    }
    let getValue = () => {
      let result;
      evaluateGet((value) => result = value);
      return isGetterSetter(result) ? result.get() : result;
    };
    let setValue = (value) => {
      let result;
      evaluateGet((value2) => result = value2);
      if (isGetterSetter(result)) {
        result.set(value);
      } else {
        evaluateSet(() => {
        }, {
          scope: { "__placeholder": value }
        });
      }
    };
    if (typeof expression === "string" && el.type === "radio") {
      mutateDom(() => {
        if (!el.hasAttribute("name"))
          el.setAttribute("name", expression);
      });
    }
    var event = el.tagName.toLowerCase() === "select" || ["checkbox", "radio"].includes(el.type) || modifiers.includes("lazy") ? "change" : "input";
    let removeListener = isCloning ? () => {
    } : on(el, event, modifiers, (e) => {
      setValue(getInputValue(el, modifiers, e, getValue()));
    });
    if (modifiers.includes("fill")) {
      if ([void 0, null, ""].includes(getValue()) || el.type === "checkbox" && Array.isArray(getValue())) {
        el.dispatchEvent(new Event(event, {}));
      }
    }
    if (!el._x_removeModelListeners)
      el._x_removeModelListeners = {};
    el._x_removeModelListeners["default"] = removeListener;
    cleanup2(() => el._x_removeModelListeners["default"]());
    if (el.form) {
      let removeResetListener = on(el.form, "reset", [], (e) => {
        nextTick(() => el._x_model && el._x_model.set(el.value));
      });
      cleanup2(() => removeResetListener());
    }
    el._x_model = {
      get() {
        return getValue();
      },
      set(value) {
        setValue(value);
      }
    };
    el._x_forceModelUpdate = (value) => {
      if (value === void 0 && typeof expression === "string" && expression.match(/\./))
        value = "";
      window.fromModel = true;
      mutateDom(() => bind(el, "value", value));
      delete window.fromModel;
    };
    effect3(() => {
      let value = getValue();
      if (modifiers.includes("unintrusive") && document.activeElement.isSameNode(el))
        return;
      el._x_forceModelUpdate(value);
    });
  });
  function getInputValue(el, modifiers, event, currentValue) {
    return mutateDom(() => {
      if (event instanceof CustomEvent && event.detail !== void 0)
        return event.detail !== null && event.detail !== void 0 ? event.detail : event.target.value;
      else if (el.type === "checkbox") {
        if (Array.isArray(currentValue)) {
          let newValue = null;
          if (modifiers.includes("number")) {
            newValue = safeParseNumber(event.target.value);
          } else if (modifiers.includes("boolean")) {
            newValue = safeParseBoolean(event.target.value);
          } else {
            newValue = event.target.value;
          }
          return event.target.checked ? currentValue.concat([newValue]) : currentValue.filter((el2) => !checkedAttrLooseCompare2(el2, newValue));
        } else {
          return event.target.checked;
        }
      } else if (el.tagName.toLowerCase() === "select" && el.multiple) {
        if (modifiers.includes("number")) {
          return Array.from(event.target.selectedOptions).map((option) => {
            let rawValue = option.value || option.text;
            return safeParseNumber(rawValue);
          });
        } else if (modifiers.includes("boolean")) {
          return Array.from(event.target.selectedOptions).map((option) => {
            let rawValue = option.value || option.text;
            return safeParseBoolean(rawValue);
          });
        }
        return Array.from(event.target.selectedOptions).map((option) => {
          return option.value || option.text;
        });
      } else {
        if (modifiers.includes("number")) {
          return safeParseNumber(event.target.value);
        } else if (modifiers.includes("boolean")) {
          return safeParseBoolean(event.target.value);
        }
        return modifiers.includes("trim") ? event.target.value.trim() : event.target.value;
      }
    });
  }
  function safeParseNumber(rawValue) {
    let number = rawValue ? parseFloat(rawValue) : null;
    return isNumeric2(number) ? number : rawValue;
  }
  function checkedAttrLooseCompare2(valueA, valueB) {
    return valueA == valueB;
  }
  function isNumeric2(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }
  function isGetterSetter(value) {
    return value !== null && typeof value === "object" && typeof value.get === "function" && typeof value.set === "function";
  }
  directive("cloak", (el) => queueMicrotask(() => mutateDom(() => el.removeAttribute(prefix("cloak")))));
  addInitSelector(() => `[${prefix("init")}]`);
  directive("init", skipDuringClone((el, { expression }, { evaluate: evaluate2 }) => {
    if (typeof expression === "string") {
      return !!expression.trim() && evaluate2(expression, {}, false);
    }
    return evaluate2(expression, {}, false);
  }));
  directive("text", (el, { expression }, { effect: effect3, evaluateLater: evaluateLater2 }) => {
    let evaluate2 = evaluateLater2(expression);
    effect3(() => {
      evaluate2((value) => {
        mutateDom(() => {
          el.textContent = value;
        });
      });
    });
  });
  directive("html", (el, { expression }, { effect: effect3, evaluateLater: evaluateLater2 }) => {
    let evaluate2 = evaluateLater2(expression);
    effect3(() => {
      evaluate2((value) => {
        mutateDom(() => {
          el.innerHTML = value;
          el._x_ignoreSelf = true;
          initTree(el);
          delete el._x_ignoreSelf;
        });
      });
    });
  });
  mapAttributes(startingWith(":", into(prefix("bind:"))));
  var handler2 = (el, { value, modifiers, expression, original }, { effect: effect3 }) => {
    if (!value) {
      let bindingProviders = {};
      injectBindingProviders(bindingProviders);
      let getBindings = evaluateLater(el, expression);
      getBindings((bindings) => {
        applyBindingsObject(el, bindings, original);
      }, { scope: bindingProviders });
      return;
    }
    if (value === "key")
      return storeKeyForXFor(el, expression);
    if (el._x_inlineBindings && el._x_inlineBindings[value] && el._x_inlineBindings[value].extract) {
      return;
    }
    let evaluate2 = evaluateLater(el, expression);
    effect3(() => evaluate2((result) => {
      if (result === void 0 && typeof expression === "string" && expression.match(/\./)) {
        result = "";
      }
      mutateDom(() => bind(el, value, result, modifiers));
    }));
  };
  handler2.inline = (el, { value, modifiers, expression }) => {
    if (!value)
      return;
    if (!el._x_inlineBindings)
      el._x_inlineBindings = {};
    el._x_inlineBindings[value] = { expression, extract: false };
  };
  directive("bind", handler2);
  function storeKeyForXFor(el, expression) {
    el._x_keyExpression = expression;
  }
  addRootSelector(() => `[${prefix("data")}]`);
  directive("data", (el, { expression }, { cleanup: cleanup2 }) => {
    if (shouldSkipRegisteringDataDuringClone(el))
      return;
    expression = expression === "" ? "{}" : expression;
    let magicContext = {};
    injectMagics(magicContext, el);
    let dataProviderContext = {};
    injectDataProviders(dataProviderContext, magicContext);
    let data2 = evaluate(el, expression, { scope: dataProviderContext });
    if (data2 === void 0 || data2 === true)
      data2 = {};
    injectMagics(data2, el);
    let reactiveData = reactive(data2);
    initInterceptors2(reactiveData);
    let undo = addScopeToNode(el, reactiveData);
    reactiveData["init"] && evaluate(el, reactiveData["init"]);
    cleanup2(() => {
      reactiveData["destroy"] && evaluate(el, reactiveData["destroy"]);
      undo();
    });
  });
  interceptClone((from, to) => {
    if (from._x_dataStack) {
      to._x_dataStack = from._x_dataStack;
      to.setAttribute("data-has-alpine-state", true);
    }
  });
  function shouldSkipRegisteringDataDuringClone(el) {
    if (!isCloning)
      return false;
    if (isCloningLegacy)
      return true;
    return el.hasAttribute("data-has-alpine-state");
  }
  directive("show", (el, { modifiers, expression }, { effect: effect3 }) => {
    let evaluate2 = evaluateLater(el, expression);
    if (!el._x_doHide)
      el._x_doHide = () => {
        mutateDom(() => {
          el.style.setProperty("display", "none", modifiers.includes("important") ? "important" : void 0);
        });
      };
    if (!el._x_doShow)
      el._x_doShow = () => {
        mutateDom(() => {
          if (el.style.length === 1 && el.style.display === "none") {
            el.removeAttribute("style");
          } else {
            el.style.removeProperty("display");
          }
        });
      };
    let hide = () => {
      el._x_doHide();
      el._x_isShown = false;
    };
    let show = () => {
      el._x_doShow();
      el._x_isShown = true;
    };
    let clickAwayCompatibleShow = () => setTimeout(show);
    let toggle = once(
      (value) => value ? show() : hide(),
      (value) => {
        if (typeof el._x_toggleAndCascadeWithTransitions === "function") {
          el._x_toggleAndCascadeWithTransitions(el, value, show, hide);
        } else {
          value ? clickAwayCompatibleShow() : hide();
        }
      }
    );
    let oldValue;
    let firstTime = true;
    effect3(() => evaluate2((value) => {
      if (!firstTime && value === oldValue)
        return;
      if (modifiers.includes("immediate"))
        value ? clickAwayCompatibleShow() : hide();
      toggle(value);
      oldValue = value;
      firstTime = false;
    }));
  });
  directive("for", (el, { expression }, { effect: effect3, cleanup: cleanup2 }) => {
    let iteratorNames = parseForExpression(expression);
    let evaluateItems = evaluateLater(el, iteratorNames.items);
    let evaluateKey = evaluateLater(
      el,
      el._x_keyExpression || "index"
    );
    el._x_prevKeys = [];
    el._x_lookup = {};
    effect3(() => loop(el, iteratorNames, evaluateItems, evaluateKey));
    cleanup2(() => {
      Object.values(el._x_lookup).forEach((el2) => el2.remove());
      delete el._x_prevKeys;
      delete el._x_lookup;
    });
  });
  function loop(el, iteratorNames, evaluateItems, evaluateKey) {
    let isObject2 = (i) => typeof i === "object" && !Array.isArray(i);
    let templateEl = el;
    evaluateItems((items) => {
      if (isNumeric3(items) && items >= 0) {
        items = Array.from(Array(items).keys(), (i) => i + 1);
      }
      if (items === void 0)
        items = [];
      let lookup = el._x_lookup;
      let prevKeys = el._x_prevKeys;
      let scopes = [];
      let keys = [];
      if (isObject2(items)) {
        items = Object.entries(items).map(([key, value]) => {
          let scope2 = getIterationScopeVariables(iteratorNames, value, key, items);
          evaluateKey((value2) => {
            if (keys.includes(value2))
              warn("Duplicate key on x-for", el);
            keys.push(value2);
          }, { scope: __spreadValues({ index: key }, scope2) });
          scopes.push(scope2);
        });
      } else {
        for (let i = 0; i < items.length; i++) {
          let scope2 = getIterationScopeVariables(iteratorNames, items[i], i, items);
          evaluateKey((value) => {
            if (keys.includes(value))
              warn("Duplicate key on x-for", el);
            keys.push(value);
          }, { scope: __spreadValues({ index: i }, scope2) });
          scopes.push(scope2);
        }
      }
      let adds = [];
      let moves = [];
      let removes = [];
      let sames = [];
      for (let i = 0; i < prevKeys.length; i++) {
        let key = prevKeys[i];
        if (keys.indexOf(key) === -1)
          removes.push(key);
      }
      prevKeys = prevKeys.filter((key) => !removes.includes(key));
      let lastKey = "template";
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let prevIndex = prevKeys.indexOf(key);
        if (prevIndex === -1) {
          prevKeys.splice(i, 0, key);
          adds.push([lastKey, i]);
        } else if (prevIndex !== i) {
          let keyInSpot = prevKeys.splice(i, 1)[0];
          let keyForSpot = prevKeys.splice(prevIndex - 1, 1)[0];
          prevKeys.splice(i, 0, keyForSpot);
          prevKeys.splice(prevIndex, 0, keyInSpot);
          moves.push([keyInSpot, keyForSpot]);
        } else {
          sames.push(key);
        }
        lastKey = key;
      }
      for (let i = 0; i < removes.length; i++) {
        let key = removes[i];
        if (!!lookup[key]._x_effects) {
          lookup[key]._x_effects.forEach(dequeueJob);
        }
        lookup[key].remove();
        lookup[key] = null;
        delete lookup[key];
      }
      for (let i = 0; i < moves.length; i++) {
        let [keyInSpot, keyForSpot] = moves[i];
        let elInSpot = lookup[keyInSpot];
        let elForSpot = lookup[keyForSpot];
        let marker = document.createElement("div");
        mutateDom(() => {
          if (!elForSpot)
            warn(`x-for ":key" is undefined or invalid`, templateEl, keyForSpot, lookup);
          elForSpot.after(marker);
          elInSpot.after(elForSpot);
          elForSpot._x_currentIfEl && elForSpot.after(elForSpot._x_currentIfEl);
          marker.before(elInSpot);
          elInSpot._x_currentIfEl && elInSpot.after(elInSpot._x_currentIfEl);
          marker.remove();
        });
        elForSpot._x_refreshXForScope(scopes[keys.indexOf(keyForSpot)]);
      }
      for (let i = 0; i < adds.length; i++) {
        let [lastKey2, index] = adds[i];
        let lastEl = lastKey2 === "template" ? templateEl : lookup[lastKey2];
        if (lastEl._x_currentIfEl)
          lastEl = lastEl._x_currentIfEl;
        let scope2 = scopes[index];
        let key = keys[index];
        let clone2 = document.importNode(templateEl.content, true).firstElementChild;
        let reactiveScope = reactive(scope2);
        addScopeToNode(clone2, reactiveScope, templateEl);
        clone2._x_refreshXForScope = (newScope) => {
          Object.entries(newScope).forEach(([key2, value]) => {
            reactiveScope[key2] = value;
          });
        };
        mutateDom(() => {
          lastEl.after(clone2);
          skipDuringClone(() => initTree(clone2))();
        });
        if (typeof key === "object") {
          warn("x-for key cannot be an object, it must be a string or an integer", templateEl);
        }
        lookup[key] = clone2;
      }
      for (let i = 0; i < sames.length; i++) {
        lookup[sames[i]]._x_refreshXForScope(scopes[keys.indexOf(sames[i])]);
      }
      templateEl._x_prevKeys = keys;
    });
  }
  function parseForExpression(expression) {
    let forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
    let stripParensRE = /^\s*\(|\)\s*$/g;
    let forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
    let inMatch = expression.match(forAliasRE);
    if (!inMatch)
      return;
    let res = {};
    res.items = inMatch[2].trim();
    let item = inMatch[1].replace(stripParensRE, "").trim();
    let iteratorMatch = item.match(forIteratorRE);
    if (iteratorMatch) {
      res.item = item.replace(forIteratorRE, "").trim();
      res.index = iteratorMatch[1].trim();
      if (iteratorMatch[2]) {
        res.collection = iteratorMatch[2].trim();
      }
    } else {
      res.item = item;
    }
    return res;
  }
  function getIterationScopeVariables(iteratorNames, item, index, items) {
    let scopeVariables = {};
    if (/^\[.*\]$/.test(iteratorNames.item) && Array.isArray(item)) {
      let names = iteratorNames.item.replace("[", "").replace("]", "").split(",").map((i) => i.trim());
      names.forEach((name, i) => {
        scopeVariables[name] = item[i];
      });
    } else if (/^\{.*\}$/.test(iteratorNames.item) && !Array.isArray(item) && typeof item === "object") {
      let names = iteratorNames.item.replace("{", "").replace("}", "").split(",").map((i) => i.trim());
      names.forEach((name) => {
        scopeVariables[name] = item[name];
      });
    } else {
      scopeVariables[iteratorNames.item] = item;
    }
    if (iteratorNames.index)
      scopeVariables[iteratorNames.index] = index;
    if (iteratorNames.collection)
      scopeVariables[iteratorNames.collection] = items;
    return scopeVariables;
  }
  function isNumeric3(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }
  function handler3() {
  }
  handler3.inline = (el, { expression }, { cleanup: cleanup2 }) => {
    let root = closestRoot(el);
    if (!root._x_refs)
      root._x_refs = {};
    root._x_refs[expression] = el;
    cleanup2(() => delete root._x_refs[expression]);
  };
  directive("ref", handler3);
  directive("if", (el, { expression }, { effect: effect3, cleanup: cleanup2 }) => {
    if (el.tagName.toLowerCase() !== "template")
      warn("x-if can only be used on a <template> tag", el);
    let evaluate2 = evaluateLater(el, expression);
    let show = () => {
      if (el._x_currentIfEl)
        return el._x_currentIfEl;
      let clone2 = el.content.cloneNode(true).firstElementChild;
      addScopeToNode(clone2, {}, el);
      mutateDom(() => {
        el.after(clone2);
        skipDuringClone(() => initTree(clone2))();
      });
      el._x_currentIfEl = clone2;
      el._x_undoIf = () => {
        walk(clone2, (node) => {
          if (!!node._x_effects) {
            node._x_effects.forEach(dequeueJob);
          }
        });
        clone2.remove();
        delete el._x_currentIfEl;
      };
      return clone2;
    };
    let hide = () => {
      if (!el._x_undoIf)
        return;
      el._x_undoIf();
      delete el._x_undoIf;
    };
    effect3(() => evaluate2((value) => {
      value ? show() : hide();
    }));
    cleanup2(() => el._x_undoIf && el._x_undoIf());
  });
  directive("id", (el, { expression }, { evaluate: evaluate2 }) => {
    let names = evaluate2(expression);
    names.forEach((name) => setIdRoot(el, name));
  });
  interceptClone((from, to) => {
    if (from._x_ids) {
      to._x_ids = from._x_ids;
    }
  });
  mapAttributes(startingWith("@", into(prefix("on:"))));
  directive("on", skipDuringClone((el, { value, modifiers, expression }, { cleanup: cleanup2 }) => {
    let evaluate2 = expression ? evaluateLater(el, expression) : () => {
    };
    if (el.tagName.toLowerCase() === "template") {
      if (!el._x_forwardEvents)
        el._x_forwardEvents = [];
      if (!el._x_forwardEvents.includes(value))
        el._x_forwardEvents.push(value);
    }
    let removeListener = on(el, value, modifiers, (e) => {
      evaluate2(() => {
      }, { scope: { "$event": e }, params: [e] });
    });
    cleanup2(() => removeListener());
  }));
  warnMissingPluginDirective("Collapse", "collapse", "collapse");
  warnMissingPluginDirective("Intersect", "intersect", "intersect");
  warnMissingPluginDirective("Focus", "trap", "focus");
  warnMissingPluginDirective("Mask", "mask", "mask");
  function warnMissingPluginDirective(name, directiveName, slug) {
    directive(directiveName, (el) => warn(`You can't use [x-${directiveName}] without first installing the "${name}" plugin here: https://alpinejs.dev/plugins/${slug}`, el));
  }
  alpine_default.setEvaluator(normalEvaluator);
  alpine_default.setReactivityEngine({ reactive: reactive2, effect: effect2, release: stop, raw: toRaw });
  var src_default = alpine_default;
  var module_default = src_default;

  // private/conf.js
  var conf = {
    NC_URL: "<your_nextcloud_uri>",
    BOARD_ENDPOINT: "/index.php/apps/deck/api/v1.1/boards"
  };
  var conf_default = conf;

  // private/login.js
  function getCredentials() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    return btoa(username + ":" + password);
  }

  // private/translations.js
  function translate(key, lang) {
    let translations = {
      en: {
        wrongPassword: "Could not log you in, are your username and password correct?",
        wrongUri: "Cannot connect to nextcloud server. Please check configured URI: ",
        loginText: "Please log in to give this app access to your Nextcloud Account.",
        doNotEdit: "Please do not edit below this line"
      },
      de: {
        wrongPassword: "Der Login war nicht m\xF6glich. Bitte Benutzername und Passwort pr\xFCfen.",
        wrongUri: "Verbindung mit dem Nextcloud Server nicht m\xF6glich. Bitte die konfigurierte URI pr\xFCfen: ",
        loginText: "Bitte einloggen, um Zugang zum Nextcloud Account zu erm\xF6glichen.",
        doNotEdit: "Unter dieser Zeile bitte nicht bearbeiten"
      }
    };
    if (!(lang in translations)) {
      lang = "en";
    }
    if (!(key in translations[lang])) {
      return "translation error";
    }
    return translations[lang][key];
  }

  // private/tasks.js
  var ganttInfoDelimiter = "#######";
  function createTasks(stacks, deckId) {
    let tasks = [];
    for (let stack of stacks) {
      if (stack.cards) {
        for (let card of stack.cards) {
          let color = null;
          if (card.labels.length > 0) {
            color = card.labels[0].color;
          }
          let newTask = new Task(
            card.id,
            card.title,
            card.stackId,
            card.description,
            card.order,
            card.owner.uid,
            card.duedate,
            color,
            deckId
          );
          tasks.push(newTask);
        }
      }
    }
    return tasks;
  }
  function filterScheduledTasks(tasks = []) {
    let filteredTasks = tasks.filter(function(task) {
      return task.isScheduled();
    });
    filteredTasks.sort(function(a, b) {
      return a.start - b.start;
    });
    return filteredTasks;
  }
  function filterUnscheduledTasks(tasks = []) {
    return tasks.filter(function(task) {
      return !task.isScheduled();
    });
  }
  var Task = class {
    constructor(id, name, stackId, description, order, owner, dueDate, color, deckId) {
      this.id = id;
      this.name = name;
      this.stackId = stackId;
      this.description = description;
      this.order = order;
      this.owner = owner;
      this.end = this.calculateEnd(dueDate);
      this.duration = this.getDurationFromDescription(description);
      this.start = this.calculateStart();
      this.class = this.getClassFromDescription(description);
      this.progress = this.getProgressFromDescription(description);
      this.dependencies = this.getDependenciesFromDescription(description);
      this.color = color;
      this.deckId = deckId;
    }
    calculateStart() {
      if (!this.end) {
        return null;
      } else if (!this.duration) {
        let startDate2 = new Date(this.end);
        startDate2.setDate(startDate2.getDate() - 1);
        return startDate2;
      }
      let startDate = new Date(this.end);
      startDate.setDate(startDate.getDate() - this.duration);
      return startDate;
    }
    calculateDuration() {
      if (!this.end) {
        return null;
      } else if (!this.start) {
        return 1;
      }
      return this.end.getDate() - this.start.getDate();
    }
    calculateEnd(date) {
      if (!date) {
        return null;
      } else {
        return new Date(date);
      }
    }
    getDurationFromDescription(taskDescription) {
      return this.extractFromDescription(taskDescription, "d") || 1;
    }
    getClassFromDescription(taskDescription) {
      return this.extractFromDescription(taskDescription, "c");
    }
    getProgressFromDescription(taskDescription) {
      return this.extractFromDescription(taskDescription, "p");
    }
    getDependenciesFromDescription(task) {
      return this.extractFromDescription(task, "w");
    }
    extractFromDescription(taskDescription, letter) {
      if (taskDescription.indexOf(`${letter}:`) !== -1) {
        return taskDescription.substring(
          taskDescription.indexOf(`${letter}:`) + 2,
          taskDescription.indexOf(`:${letter}`)
        );
      }
      return null;
    }
    setDueDateAndDuration(start2, end) {
      const msPerDay = 1e3 * 60 * 60 * 24;
      let duration = Math.round((end - start2) / msPerDay);
      this.setDurationInDescription(duration);
      this.end = this.calculateEnd(end);
      this.putToRemote();
    }
    setDurationInDescription(newDurationInDays) {
      this.setInDescription("d", newDurationInDays);
    }
    setProgressInDescription(newProgress) {
      this.setInDescription("p", newProgress);
    }
    setProgress(newProgress) {
      this.setProgressInDescription(newProgress);
      this.putToRemote();
    }
    setDependencyInDescription(task, newDependency) {
      this.setInDescription("w", newDependency);
    }
    setInDescription(letter, value) {
      let regex = new RegExp(letter + ":(.*?):" + letter);
      let newExp = `${letter}:${value}:${letter}`;
      let description = this.description;
      let ganttInfosStartIndex = description.match(ganttInfoDelimiter) ? description.match(ganttInfoDelimiter).index : description.length;
      let ganttInfos = description.substring(ganttInfosStartIndex);
      if (!ganttInfos.startsWith(ganttInfoDelimiter)) {
        ganttInfos = " \n \n \n \n \n \n \n \n \n " + ganttInfoDelimiter + " " + translate("doNotEdit", navigator.language || navigator.userLanguage) + " " + ganttInfoDelimiter + "\n" + ganttInfos;
      }
      if (ganttInfos.search(regex) !== -1) {
        ganttInfos = ganttInfos.replace(regex, newExp);
      } else {
        ganttInfos = ganttInfos + newExp + "\n";
      }
      this.description = description.substring(0, ganttInfosStartIndex) + ganttInfos;
    }
    isScheduled() {
      return !!this.end;
    }
    async putToRemote() {
      let requestData = {
        description: this.description,
        duedate: this.end,
        order: this.order,
        owner: this.owner,
        title: this.name,
        type: "plain"
      };
      let response = await fetch(
        conf_default.NC_URL + conf_default.BOARD_ENDPOINT + `/${this.deckId}/stacks/${this.stackId}/cards/${this.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Basic " + getCredentials()
          },
          body: JSON.stringify(requestData)
        }
      );
      if (response.status != 200) {
        setErrorMessage(response, "Could not update task");
      }
    }
  };

  // private/frappe-gantt-helpers.js
  var exportFunctions = {
    elementResized(element) {
      return elementResized(element);
    }
  };
  async function elementResized(element) {
    return new Promise((resolve) => {
      const checkWidth = () => {
        const width = element.getBoundingClientRect().width;
        if (width > 10) {
          resolve();
        } else {
          setTimeout(checkWidth, 100);
        }
      };
      checkWidth();
    });
  }
  var frappe_gantt_helpers_default = exportFunctions;

  // private/frappe-gantt.js
  var Gantt = function() {
    "use strict";
    const YEAR = "year";
    const MONTH = "month";
    const DAY = "day";
    const HOUR = "hour";
    const MINUTE = "minute";
    const SECOND = "second";
    const MILLISECOND = "millisecond";
    const month_names = {
      en: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ],
      ru: [
        "\u042F\u043D\u0432\u0430\u0440\u044C",
        "\u0424\u0435\u0432\u0440\u0430\u043B\u044C",
        "\u041C\u0430\u0440\u0442",
        "\u0410\u043F\u0440\u0435\u043B\u044C",
        "\u041C\u0430\u0439",
        "\u0418\u044E\u043D\u044C",
        "\u0418\u044E\u043B\u044C",
        "\u0410\u0432\u0433\u0443\u0441\u0442",
        "\u0421\u0435\u043D\u0442\u044F\u0431\u0440\u044C",
        "\u041E\u043A\u0442\u044F\u0431\u0440\u044C",
        "\u041D\u043E\u044F\u0431\u0440\u044C",
        "\u0414\u0435\u043A\u0430\u0431\u0440\u044C"
      ],
      fr: [
        "Janvier",
        "Fevrier",
        "Mars",
        "Avril",
        "Mai",
        "Juin",
        "Juillet",
        "Aout",
        "Septembre",
        "Octobre",
        "Novembre",
        "Decembre"
      ],
      de: [
        "Januar",
        "Februar",
        "M\xE4rz",
        "April",
        "Mai",
        "Juni",
        "Juli",
        "August",
        "September",
        "Oktober",
        "November",
        "Dezember"
      ]
    };
    var date_utils = {
      parse(date, date_separator = "-", time_separator = /[.:]/) {
        if (date instanceof Date) {
          return date;
        }
        if (typeof date === "string") {
          let date_parts, time_parts;
          const parts = date.split(" ");
          date_parts = parts[0].split(date_separator).map((val) => parseInt(val, 10));
          time_parts = parts[1] && parts[1].split(time_separator);
          date_parts[1] = date_parts[1] - 1;
          let vals = date_parts;
          if (time_parts && time_parts.length) {
            if (time_parts.length == 4) {
              time_parts[3] = "0." + time_parts[3];
              time_parts[3] = parseFloat(time_parts[3]) * 1e3;
            }
            vals = vals.concat(time_parts);
          }
          return new Date(...vals);
        }
      },
      to_string(date, with_time = false) {
        if (!(date instanceof Date)) {
          throw new TypeError("Invalid argument type");
        }
        const vals = this.get_date_values(date).map((val, i) => {
          if (i === 1) {
            val = val + 1;
          }
          if (i === 6) {
            return padStart(val + "", 3, "0");
          }
          return padStart(val + "", 2, "0");
        });
        const date_string = `${vals[0]}-${vals[1]}-${vals[2]}`;
        const time_string = `${vals[3]}:${vals[4]}:${vals[5]}.${vals[6]}`;
        return date_string + (with_time ? " " + time_string : "");
      },
      format(date, format_string = "YYYY-MM-DD HH:mm:ss.SSS", lang = "en") {
        const values = this.get_date_values(date).map((d) => padStart(d, 2, 0));
        const format_map = {
          YYYY: values[0],
          MM: padStart(+values[1] + 1, 2, 0),
          DD: values[2],
          HH: values[3],
          mm: values[4],
          ss: values[5],
          SSS: values[6],
          D: values[2],
          MMMM: month_names[lang][+values[1]],
          MMM: month_names[lang][+values[1]]
        };
        let str = format_string;
        const formatted_values = [];
        Object.keys(format_map).sort((a, b) => b.length - a.length).forEach((key) => {
          if (str.includes(key)) {
            str = str.replace(key, `$${formatted_values.length}`);
            formatted_values.push(format_map[key]);
          }
        });
        formatted_values.forEach((value, i) => {
          str = str.replace(`$${i}`, value);
        });
        return str;
      },
      diff(date_a, date_b, scale = DAY) {
        let milliseconds, seconds, hours, minutes, days, months, years;
        milliseconds = date_a - date_b;
        seconds = milliseconds / 1e3;
        minutes = seconds / 60;
        hours = minutes / 60;
        days = hours / 24;
        months = days / 30;
        years = months / 12;
        if (!scale.endsWith("s")) {
          scale += "s";
        }
        return Math.floor(
          {
            milliseconds,
            seconds,
            minutes,
            hours,
            days,
            months,
            years
          }[scale]
        );
      },
      today() {
        const vals = this.get_date_values(new Date()).slice(0, 3);
        return new Date(...vals);
      },
      now() {
        return new Date();
      },
      add(date, qty, scale) {
        qty = parseInt(qty, 10);
        const vals = [
          date.getFullYear() + (scale === YEAR ? qty : 0),
          date.getMonth() + (scale === MONTH ? qty : 0),
          date.getDate() + (scale === DAY ? qty : 0),
          date.getHours() + (scale === HOUR ? qty : 0),
          date.getMinutes() + (scale === MINUTE ? qty : 0),
          date.getSeconds() + (scale === SECOND ? qty : 0),
          date.getMilliseconds() + (scale === MILLISECOND ? qty : 0)
        ];
        return new Date(...vals);
      },
      start_of(date, scale) {
        const scores = {
          [YEAR]: 6,
          [MONTH]: 5,
          [DAY]: 4,
          [HOUR]: 3,
          [MINUTE]: 2,
          [SECOND]: 1,
          [MILLISECOND]: 0
        };
        function should_reset(_scale) {
          const max_score = scores[scale];
          return scores[_scale] <= max_score;
        }
        const vals = [
          date.getFullYear(),
          should_reset(YEAR) ? 0 : date.getMonth(),
          should_reset(MONTH) ? 1 : date.getDate(),
          should_reset(DAY) ? 0 : date.getHours(),
          should_reset(HOUR) ? 0 : date.getMinutes(),
          should_reset(MINUTE) ? 0 : date.getSeconds(),
          should_reset(SECOND) ? 0 : date.getMilliseconds()
        ];
        return new Date(...vals);
      },
      clone(date) {
        return new Date(...this.get_date_values(date));
      },
      get_date_values(date) {
        return [
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          date.getHours(),
          date.getMinutes(),
          date.getSeconds(),
          date.getMilliseconds()
        ];
      },
      get_days_in_month(date) {
        const no_of_days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const month = date.getMonth();
        if (month !== 1) {
          return no_of_days[month];
        }
        const year = date.getFullYear();
        if (year % 4 == 0 && year % 100 != 0 || year % 400 == 0) {
          return 29;
        }
        return 28;
      }
    };
    function padStart(str, targetLength, padString) {
      str = str + "";
      targetLength = targetLength >> 0;
      padString = String(typeof padString !== "undefined" ? padString : " ");
      if (str.length > targetLength) {
        return String(str);
      } else {
        targetLength = targetLength - str.length;
        if (targetLength > padString.length) {
          padString += padString.repeat(targetLength / padString.length);
        }
        return padString.slice(0, targetLength) + String(str);
      }
    }
    function $(expr, con) {
      return typeof expr === "string" ? (con || document).querySelector(expr) : expr || null;
    }
    function createSVG(tag, attrs) {
      const elem = document.createElementNS("http://www.w3.org/2000/svg", tag);
      for (let attr in attrs) {
        if (attr === "append_to") {
          const parent = attrs.append_to;
          parent.appendChild(elem);
        } else if (attr === "innerHTML") {
          elem.innerHTML = attrs.innerHTML;
        } else {
          elem.setAttribute(attr, attrs[attr]);
        }
      }
      return elem;
    }
    function animateSVG(svgElement, attr, from, to) {
      const animatedSvgElement = getAnimationElement(svgElement, attr, from, to);
      if (animatedSvgElement === svgElement) {
        const event = document.createEvent("HTMLEvents");
        event.initEvent("click", true, true);
        event.eventName = "click";
        animatedSvgElement.dispatchEvent(event);
      }
    }
    function getAnimationElement(svgElement, attr, from, to, dur = "0.4s", begin = "0.1s") {
      const animEl = svgElement.querySelector("animate");
      if (animEl) {
        $.attr(animEl, {
          attributeName: attr,
          from,
          to,
          dur,
          begin: "click + " + begin
        });
        return svgElement;
      }
      const animateElement = createSVG("animate", {
        attributeName: attr,
        from,
        to,
        dur,
        begin,
        calcMode: "spline",
        values: from + ";" + to,
        keyTimes: "0; 1",
        keySplines: cubic_bezier("ease-out")
      });
      svgElement.appendChild(animateElement);
      return svgElement;
    }
    function cubic_bezier(name) {
      return {
        ease: ".25 .1 .25 1",
        linear: "0 0 1 1",
        "ease-in": ".42 0 1 1",
        "ease-out": "0 0 .58 1",
        "ease-in-out": ".42 0 .58 1"
      }[name];
    }
    $.on = (element, event, selector, callback) => {
      if (!callback) {
        callback = selector;
        $.bind(element, event, callback);
      } else {
        $.delegate(element, event, selector, callback);
      }
    };
    $.off = (element, event, handler4) => {
      element.removeEventListener(event, handler4);
    };
    $.bind = (element, event, callback) => {
      event.split(/\s+/).forEach(function(event2) {
        element.addEventListener(event2, callback);
      });
    };
    $.delegate = (element, event, selector, callback) => {
      element.addEventListener(event, function(e) {
        const delegatedTarget = e.target.closest(selector);
        if (delegatedTarget) {
          e.delegatedTarget = delegatedTarget;
          callback.call(this, e, delegatedTarget);
        }
      });
    };
    $.closest = (selector, element) => {
      if (!element)
        return null;
      if (element.matches(selector)) {
        return element;
      }
      return $.closest(selector, element.parentNode);
    };
    $.attr = (element, attr, value) => {
      if (!value && typeof attr === "string") {
        return element.getAttribute(attr);
      }
      if (typeof attr === "object") {
        for (let key in attr) {
          $.attr(element, key, attr[key]);
        }
        return;
      }
      element.setAttribute(attr, value);
    };
    class Bar {
      constructor(gantt2, task) {
        this.set_defaults(gantt2, task);
        this.prepare();
        this.draw();
        this.bind();
      }
      set_defaults(gantt2, task) {
        this.action_completed = false;
        this.gantt = gantt2;
        this.task = task;
      }
      prepare() {
        this.prepare_values();
        this.prepare_helpers();
      }
      prepare_values() {
        this.invalid = this.task.invalid;
        this.height = this.gantt.options.bar_height;
        this.x = this.compute_x();
        this.y = this.compute_y();
        this.corner_radius = this.gantt.options.bar_corner_radius;
        this.duration = date_utils.diff(this.task._end, this.task._start, "hour") / this.gantt.options.step;
        this.width = this.gantt.options.column_width * this.duration;
        this.color = this.task.color;
        this.progress_width = this.gantt.options.column_width * this.duration * (this.task.progress / 100) || 0;
        this.group = createSVG("g", {
          class: "bar-wrapper " + (this.task.custom_class || ""),
          "data-id": this.task.id
        });
        this.bar_group = createSVG("g", {
          class: "bar-group",
          append_to: this.group
        });
        this.handle_group = createSVG("g", {
          class: "handle-group",
          append_to: this.group
        });
      }
      prepare_helpers() {
        SVGElement.prototype.getX = function() {
          return +this.getAttribute("x");
        };
        SVGElement.prototype.getY = function() {
          return +this.getAttribute("y");
        };
        SVGElement.prototype.getWidth = function() {
          return +this.getAttribute("width");
        };
        SVGElement.prototype.getHeight = function() {
          return +this.getAttribute("height");
        };
        SVGElement.prototype.getEndX = function() {
          return this.getX() + this.getWidth();
        };
      }
      draw() {
        this.draw_bar();
        this.draw_progress_bar();
        this.draw_label();
        this.draw_resize_handles();
      }
      draw_bar() {
        this.$bar = createSVG("rect", {
          x: this.x,
          y: this.y,
          width: this.width,
          height: this.height,
          rx: this.corner_radius,
          ry: this.corner_radius,
          class: "bar",
          style: "fill:#" + this.color,
          append_to: this.bar_group
        });
        animateSVG(this.$bar, "width", 0, this.width);
        if (this.invalid) {
          this.$bar.classList.add("bar-invalid");
        }
      }
      draw_progress_bar() {
        if (this.invalid)
          return;
        this.$bar_progress = createSVG("rect", {
          x: this.x,
          y: this.y,
          width: this.progress_width,
          height: this.height,
          rx: this.corner_radius,
          ry: this.corner_radius,
          class: "bar-progress",
          append_to: this.bar_group
        });
        animateSVG(this.$bar_progress, "width", 0, this.progress_width);
      }
      draw_label() {
        createSVG("text", {
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          innerHTML: this.task.name,
          class: "bar-label",
          append_to: this.bar_group
        });
        requestAnimationFrame(() => this.update_label_position());
      }
      draw_resize_handles() {
        if (this.invalid)
          return;
        const bar = this.$bar;
        const handle_width = 8;
        createSVG("rect", {
          x: bar.getX() + bar.getWidth() - 9,
          y: bar.getY() + 1,
          width: handle_width,
          height: this.height - 2,
          rx: this.corner_radius,
          ry: this.corner_radius,
          class: "handle right",
          append_to: this.handle_group
        });
        createSVG("rect", {
          x: bar.getX() + 1,
          y: bar.getY() + 1,
          width: handle_width,
          height: this.height - 2,
          rx: this.corner_radius,
          ry: this.corner_radius,
          class: "handle left",
          append_to: this.handle_group
        });
        if (this.task.progress && this.task.progress < 100) {
          this.$handle_progress = createSVG("polygon", {
            points: this.get_progress_polygon_points().join(","),
            class: "handle progress",
            append_to: this.handle_group
          });
        }
      }
      get_progress_polygon_points() {
        const bar_progress = this.$bar_progress;
        return [
          bar_progress.getEndX() - 5,
          bar_progress.getY() + bar_progress.getHeight(),
          bar_progress.getEndX() + 5,
          bar_progress.getY() + bar_progress.getHeight(),
          bar_progress.getEndX(),
          bar_progress.getY() + bar_progress.getHeight() - 8.66
        ];
      }
      bind() {
        if (this.invalid)
          return;
        this.setup_click_event();
      }
      setup_click_event() {
        $.on(this.group, "focus " + this.gantt.options.popup_trigger, (e) => {
          if (this.action_completed) {
            return;
          }
          if (e.type === "click") {
            this.gantt.trigger_event("click", [this.task]);
          }
          this.gantt.unselect_all();
          this.group.classList.toggle("active");
          this.show_popup();
        });
      }
      show_popup() {
        if (this.gantt.bar_being_dragged)
          return;
        const start_date = date_utils.format(this.task._start, "MMM D");
        const end_date = date_utils.format(
          date_utils.add(this.task._end, -1, "second"),
          "MMM D"
        );
        const subtitle = start_date + " - " + end_date;
        this.gantt.show_popup({
          target_element: this.$bar,
          title: this.task.name,
          subtitle,
          task: this.task
        });
      }
      update_bar_position({ x = null, width = null }) {
        const bar = this.$bar;
        if (x) {
          const xs = this.task.dependencies.map((dep) => {
            return this.gantt.get_bar(dep).$bar.getX();
          });
          const valid_x = xs.reduce((prev, curr) => {
            return x >= curr;
          }, x);
          if (!valid_x) {
            width = null;
            return;
          }
          this.update_attr(bar, "x", x);
        }
        if (width && width >= this.gantt.options.column_width) {
          this.update_attr(bar, "width", width);
        }
        this.update_label_position();
        this.update_handle_position();
        this.update_progressbar_position();
        this.update_arrow_position();
      }
      date_changed() {
        let changed = false;
        const { new_start_date, new_end_date } = this.compute_start_end_date();
        if (Number(this.task._start) !== Number(new_start_date)) {
          changed = true;
          this.task._start = new_start_date;
        }
        if (Number(this.task._end) !== Number(new_end_date)) {
          changed = true;
          this.task._end = new_end_date;
        }
        if (!changed)
          return;
        this.gantt.trigger_event("date_change", [
          this.task,
          new_start_date,
          date_utils.add(new_end_date, -1, "second")
        ]);
      }
      progress_changed() {
        const new_progress = this.compute_progress();
        this.task.progress = new_progress;
        this.gantt.trigger_event("progress_change", [this.task, new_progress]);
      }
      set_action_completed() {
        this.action_completed = true;
        setTimeout(() => this.action_completed = false, 1e3);
      }
      compute_start_end_date() {
        const bar = this.$bar;
        const x_in_units = bar.getX() / this.gantt.options.column_width;
        const new_start_date = date_utils.add(
          this.gantt.gantt_start,
          x_in_units * this.gantt.options.step,
          "hour"
        );
        const width_in_units = bar.getWidth() / this.gantt.options.column_width;
        const new_end_date = date_utils.add(
          new_start_date,
          width_in_units * this.gantt.options.step,
          "hour"
        );
        return { new_start_date, new_end_date };
      }
      compute_progress() {
        const progress = this.$bar_progress.getWidth() / this.$bar.getWidth() * 100;
        return parseInt(progress, 10);
      }
      compute_x() {
        const { step, column_width } = this.gantt.options;
        const task_start = this.task._start;
        const gantt_start = this.gantt.gantt_start;
        const diff = date_utils.diff(task_start, gantt_start, "hour");
        let x = diff / step * column_width;
        if (this.gantt.view_is("Month")) {
          const diff2 = date_utils.diff(task_start, gantt_start, "day");
          x = diff2 * column_width / 30;
        }
        return x;
      }
      compute_y() {
        return this.gantt.options.header_height + this.gantt.options.padding + this.task._index * (this.height + this.gantt.options.padding);
      }
      get_snap_position(dx) {
        let odx = dx, rem, position;
        if (this.gantt.view_is("Week")) {
          rem = dx % (this.gantt.options.column_width / 7);
          position = odx - rem + (rem < this.gantt.options.column_width / 14 ? 0 : this.gantt.options.column_width / 7);
        } else if (this.gantt.view_is("Month")) {
          rem = dx % (this.gantt.options.column_width / 30);
          position = odx - rem + (rem < this.gantt.options.column_width / 60 ? 0 : this.gantt.options.column_width / 30);
        } else {
          rem = dx % this.gantt.options.column_width;
          position = odx - rem + (rem < this.gantt.options.column_width / 2 ? 0 : this.gantt.options.column_width);
        }
        return position;
      }
      update_attr(element, attr, value) {
        value = +value;
        if (!isNaN(value)) {
          element.setAttribute(attr, value);
        }
        return element;
      }
      update_progressbar_position() {
        this.$bar_progress.setAttribute("x", this.$bar.getX());
        this.$bar_progress.setAttribute(
          "width",
          this.$bar.getWidth() * (this.task.progress / 100)
        );
      }
      update_label_position() {
        const bar = this.$bar, label = this.group.querySelector(".bar-label");
        label.setAttribute("x", bar.getX() + bar.getWidth() + 5);
      }
      update_handle_position() {
        const bar = this.$bar;
        this.handle_group.querySelector(".handle.left").setAttribute("x", bar.getX() + 1);
        this.handle_group.querySelector(".handle.right").setAttribute("x", bar.getEndX() - 9);
        const handle = this.group.querySelector(".handle.progress");
        handle && handle.setAttribute("points", this.get_progress_polygon_points());
      }
      update_arrow_position() {
        this.arrows = this.arrows || [];
        for (let arrow of this.arrows) {
          arrow.update();
        }
      }
    }
    class Arrow {
      constructor(gantt2, from_task, to_task) {
        this.gantt = gantt2;
        this.from_task = from_task;
        this.to_task = to_task;
        this.calculate_path();
        this.draw();
      }
      calculate_path() {
        let start_x = this.from_task.$bar.getX() + this.from_task.$bar.getWidth() / 2;
        const condition = () => this.to_task.$bar.getX() < start_x + this.gantt.options.padding && start_x > this.from_task.$bar.getX() + this.gantt.options.padding;
        while (condition()) {
          start_x -= 10;
        }
        const start_y = this.gantt.options.header_height + this.gantt.options.bar_height + (this.gantt.options.padding + this.gantt.options.bar_height) * this.from_task.task._index + this.gantt.options.padding;
        const end_x = this.to_task.$bar.getX() - this.gantt.options.padding / 2;
        const end_y = this.gantt.options.header_height + this.gantt.options.bar_height / 2 + (this.gantt.options.padding + this.gantt.options.bar_height) * this.to_task.task._index + this.gantt.options.padding;
        const from_is_below_to = this.from_task.task._index > this.to_task.task._index;
        const curve = this.gantt.options.arrow_curve;
        const clockwise = from_is_below_to ? 1 : 0;
        const curve_y = from_is_below_to ? -curve : curve;
        const offset = from_is_below_to ? end_y + this.gantt.options.arrow_curve : end_y - this.gantt.options.arrow_curve;
        this.path = `
            M ${start_x} ${start_y}
            V ${offset}
            a ${curve} ${curve} 0 0 ${clockwise} ${curve} ${curve_y}
            L ${end_x} ${end_y}
            m -5 -5
            l 5 5
            l -5 5`;
        if (this.to_task.$bar.getX() < this.from_task.$bar.getX() + this.gantt.options.padding) {
          const down_1 = this.gantt.options.padding / 2 - curve;
          const down_2 = this.to_task.$bar.getY() + this.to_task.$bar.getHeight() / 2 - curve_y;
          const left = this.to_task.$bar.getX() - this.gantt.options.padding;
          this.path = `
                M ${start_x} ${start_y}
                v ${down_1}
                a ${curve} ${curve} 0 0 1 -${curve} ${curve}
                H ${left}
                a ${curve} ${curve} 0 0 ${clockwise} -${curve} ${curve_y}
                V ${down_2}
                a ${curve} ${curve} 0 0 ${clockwise} ${curve} ${curve_y}
                L ${end_x} ${end_y}
                m -5 -5
                l 5 5
                l -5 5`;
        }
      }
      draw() {
        this.element = createSVG("path", {
          d: this.path,
          "data-from": this.from_task.task.id,
          "data-to": this.to_task.task.id
        });
      }
      update() {
        this.calculate_path();
        this.element.setAttribute("d", this.path);
      }
    }
    class Popup {
      constructor(parent, custom_html) {
        this.parent = parent;
        this.custom_html = custom_html;
        this.make();
      }
      make() {
        this.parent.innerHTML = `
            <div class="title"></div>
            <div class="subtitle"></div>
            <div class="pointer"></div>
        `;
        this.hide();
        this.title = this.parent.querySelector(".title");
        this.subtitle = this.parent.querySelector(".subtitle");
        this.pointer = this.parent.querySelector(".pointer");
      }
      show(options) {
        if (!options.target_element) {
          throw new Error("target_element is required to show popup");
        }
        if (!options.position) {
          options.position = "left";
        }
        const target_element = options.target_element;
        if (this.custom_html) {
          let html = this.custom_html(options.task);
          html += '<div class="pointer"></div>';
          this.parent.innerHTML = html;
          this.pointer = this.parent.querySelector(".pointer");
        } else {
          this.title.innerHTML = options.title;
          this.subtitle.innerHTML = options.subtitle;
          this.parent.style.width = this.parent.clientWidth + "px";
        }
        let position_meta;
        if (target_element instanceof HTMLElement) {
          position_meta = target_element.getBoundingClientRect();
        } else if (target_element instanceof SVGElement) {
          position_meta = options.target_element.getBBox();
        }
        if (options.position === "left") {
          this.parent.style.left = position_meta.x + (position_meta.width + 10) + "px";
          this.parent.style.top = position_meta.y + "px";
          this.pointer.style.transform = "rotateZ(90deg)";
          this.pointer.style.left = "-7px";
          this.pointer.style.top = "2px";
        }
        this.parent.style.opacity = 1;
      }
      hide() {
        this.parent.style.opacity = 0;
      }
    }
    class Gantt2 {
      constructor(wrapper, tasks, options) {
        this.setup_wrapper(wrapper);
        this.setup_options(options);
        this.setup_tasks(tasks);
        this.change_view_mode();
        this.bind_events();
      }
      setup_wrapper(element) {
        let svg_element, wrapper_element;
        if (typeof element === "string") {
          element = document.querySelector(element);
        }
        if (element instanceof HTMLElement) {
          wrapper_element = element;
          svg_element = element.querySelector("svg");
        } else if (element instanceof SVGElement) {
          svg_element = element;
        } else {
          throw new TypeError(
            "Frapp\xE9 Gantt only supports usage of a string CSS selector, HTML DOM element or SVG DOM element for the 'element' parameter"
          );
        }
        if (!svg_element) {
          this.$svg = createSVG("svg", {
            append_to: wrapper_element,
            class: "gantt"
          });
        } else {
          this.$svg = svg_element;
          this.$svg.classList.add("gantt");
        }
        this.$container = document.createElement("div");
        this.$container.classList.add("gantt-container");
        const parent_element = this.$svg.parentElement;
        parent_element.appendChild(this.$container);
        this.$container.appendChild(this.$svg);
        this.popup_wrapper = document.createElement("div");
        this.popup_wrapper.classList.add("popup-wrapper");
        this.$container.appendChild(this.popup_wrapper);
      }
      setup_options(options) {
        const default_options = {
          header_height: 50,
          column_width: 30,
          step: 24,
          view_modes: ["Quarter Day", "Half Day", "Day", "Week", "Month", "Year"],
          bar_height: 20,
          bar_corner_radius: 3,
          arrow_curve: 5,
          padding: 18,
          view_mode: "Day",
          date_format: "YYYY-MM-DD",
          popup_trigger: "click",
          custom_popup_html: null,
          language: "en"
        };
        this.options = Object.assign({}, default_options, options);
      }
      setup_tasks(tasks) {
        this.tasks = tasks.map((task, i) => {
          task._start = date_utils.parse(task.start);
          task._end = date_utils.parse(task.end);
          if (date_utils.diff(task._end, task._start, "year") > 10) {
            task.end = null;
          }
          task._index = i;
          if (!task.start && !task.end) {
            const today = date_utils.today();
            task._start = today;
            task._end = date_utils.add(today, 2, "day");
          }
          if (!task.start && task.end) {
            task._start = date_utils.add(task._end, -2, "day");
          }
          if (task.start && !task.end) {
            task._end = date_utils.add(task._start, 2, "day");
          }
          const task_end_values = date_utils.get_date_values(task._end);
          if (task_end_values.slice(3).every((d) => d === 0)) {
            task._end = date_utils.add(task._end, 24, "hour");
          }
          if (!task.start || !task.end) {
            task.invalid = true;
          }
          if (typeof task.dependencies === "string" || !task.dependencies) {
            let deps = [];
            if (task.dependencies) {
              deps = task.dependencies.split(",").map((d) => d.trim()).filter((d) => d);
            }
            task.dependencies = deps;
          }
          if (!task.id) {
            task.id = generate_id(task);
          }
          return task;
        });
        this.setup_dependencies();
      }
      setup_dependencies() {
        this.dependency_map = {};
        for (let t of this.tasks) {
          for (let d of t.dependencies) {
            this.dependency_map[d] = this.dependency_map[d] || [];
            this.dependency_map[d].push(t.id);
          }
        }
      }
      refresh(tasks) {
        this.setup_tasks(tasks);
        this.change_view_mode();
      }
      change_view_mode(mode = this.options.view_mode) {
        this.update_view_scale(mode);
        this.setup_dates();
        this.render();
        this.trigger_event("view_change", [mode]);
      }
      update_view_scale(view_mode) {
        this.options.view_mode = view_mode;
        if (view_mode === "Day") {
          this.options.step = 24;
          this.options.column_width = 38;
        } else if (view_mode === "Half Day") {
          this.options.step = 24 / 2;
          this.options.column_width = 38;
        } else if (view_mode === "Quarter Day") {
          this.options.step = 24 / 4;
          this.options.column_width = 38;
        } else if (view_mode === "Week") {
          this.options.step = 24 * 7;
          this.options.column_width = 140;
        } else if (view_mode === "Month") {
          this.options.step = 24 * 30;
          this.options.column_width = 120;
        } else if (view_mode === "Year") {
          this.options.step = 24 * 365;
          this.options.column_width = 120;
        }
      }
      setup_dates() {
        this.setup_gantt_dates();
        this.setup_date_values();
      }
      setup_gantt_dates() {
        this.gantt_start = this.gantt_end = null;
        for (let task of this.tasks) {
          if (!this.gantt_start || task._start < this.gantt_start) {
            this.gantt_start = task._start;
          }
          if (!this.gantt_end || task._end > this.gantt_end) {
            this.gantt_end = task._end;
          }
        }
        this.gantt_start = date_utils.start_of(this.gantt_start, "day");
        this.gantt_end = date_utils.start_of(this.gantt_end, "day");
        if (this.view_is(["Quarter Day", "Half Day"])) {
          this.gantt_start = date_utils.add(this.gantt_start, -7, "day");
          this.gantt_end = date_utils.add(this.gantt_end, 7, "day");
        } else if (this.view_is("Month")) {
          this.gantt_start = date_utils.start_of(this.gantt_start, "year");
          this.gantt_end = date_utils.add(this.gantt_end, 1, "year");
        } else if (this.view_is("Year")) {
          this.gantt_start = date_utils.add(this.gantt_start, -2, "year");
          this.gantt_end = date_utils.add(this.gantt_end, 2, "year");
        } else {
          this.gantt_start = date_utils.add(this.gantt_start, -1, "month");
          this.gantt_end = date_utils.add(this.gantt_end, 1, "month");
        }
      }
      setup_date_values() {
        this.dates = [];
        let cur_date = null;
        while (cur_date === null || cur_date < this.gantt_end) {
          if (!cur_date) {
            cur_date = date_utils.clone(this.gantt_start);
          } else {
            if (this.view_is("Year")) {
              cur_date = date_utils.add(cur_date, 1, "year");
            } else if (this.view_is("Month")) {
              cur_date = date_utils.add(cur_date, 1, "month");
            } else {
              cur_date = date_utils.add(cur_date, this.options.step, "hour");
            }
          }
          this.dates.push(cur_date);
        }
      }
      bind_events() {
        this.bind_grid_click();
        this.bind_bar_events();
      }
      render() {
        this.clear();
        this.setup_layers();
        this.make_grid();
        this.make_dates();
        this.make_bars();
        this.make_arrows();
        this.map_arrows_on_bars();
        this.set_width();
        frappe_gantt_helpers_default.elementResized(this.$svg).then(
          () => this.set_scroll_position()
        );
      }
      setup_layers() {
        this.layers = {};
        const layers = ["grid", "date", "arrow", "progress", "bar", "details"];
        for (let layer of layers) {
          this.layers[layer] = createSVG("g", {
            class: layer,
            append_to: this.$svg
          });
        }
      }
      make_grid() {
        this.make_grid_background();
        this.make_grid_rows();
        this.make_grid_header();
        this.make_grid_ticks();
        this.make_grid_highlights();
      }
      make_grid_background() {
        const grid_width = this.dates.length * this.options.column_width;
        const grid_height = this.options.header_height + this.options.padding + (this.options.bar_height + this.options.padding) * this.tasks.length;
        createSVG("rect", {
          x: 0,
          y: 0,
          width: grid_width,
          height: grid_height,
          class: "grid-background",
          append_to: this.layers.grid
        });
        $.attr(this.$svg, {
          height: grid_height + this.options.padding + 100,
          width: "100%"
        });
      }
      make_grid_rows() {
        const rows_layer = createSVG("g", { append_to: this.layers.grid });
        const lines_layer = createSVG("g", { append_to: this.layers.grid });
        const row_width = this.dates.length * this.options.column_width;
        const row_height = this.options.bar_height + this.options.padding;
        let row_y = this.options.header_height + this.options.padding / 2;
        for (let task of this.tasks) {
          createSVG("rect", {
            x: 0,
            y: row_y,
            width: row_width,
            height: row_height,
            class: "grid-row",
            append_to: rows_layer
          });
          createSVG("line", {
            x1: 0,
            y1: row_y + row_height,
            x2: row_width,
            y2: row_y + row_height,
            class: "row-line",
            append_to: lines_layer
          });
          row_y += this.options.bar_height + this.options.padding;
        }
      }
      make_grid_header() {
        const header_width = this.dates.length * this.options.column_width;
        const header_height = this.options.header_height + 10;
        createSVG("rect", {
          x: 0,
          y: 0,
          width: header_width,
          height: header_height,
          class: "grid-header",
          append_to: this.layers.grid
        });
      }
      make_grid_ticks() {
        let tick_x = 0;
        let tick_y = this.options.header_height + this.options.padding / 2;
        let tick_height = (this.options.bar_height + this.options.padding) * this.tasks.length;
        for (let date of this.dates) {
          let tick_class = "tick";
          if (this.view_is("Day") && date.getDate() === 1) {
            tick_class += " thick";
          }
          if (this.view_is("Week") && date.getDate() >= 1 && date.getDate() < 8) {
            tick_class += " thick";
          }
          if (this.view_is("Month") && (date.getMonth() + 1) % 3 === 0) {
            tick_class += " thick";
          }
          createSVG("path", {
            d: `M ${tick_x} ${tick_y} v ${tick_height}`,
            class: tick_class,
            append_to: this.layers.grid
          });
          if (this.view_is("Month")) {
            tick_x += date_utils.get_days_in_month(date) * this.options.column_width / 30;
          } else {
            tick_x += this.options.column_width;
          }
        }
      }
      make_grid_highlights() {
        if (this.view_is("Day")) {
          const x = date_utils.diff(date_utils.today(), this.gantt_start, "hour") / this.options.step * this.options.column_width;
          const y = 0;
          const width = this.options.column_width;
          const height = (this.options.bar_height + this.options.padding) * this.tasks.length + this.options.header_height + this.options.padding / 2;
          createSVG("rect", {
            x,
            y,
            width,
            height,
            class: "today-highlight",
            append_to: this.layers.grid
          });
        }
      }
      make_dates() {
        for (let date of this.get_dates_to_draw()) {
          createSVG("text", {
            x: date.lower_x,
            y: date.lower_y,
            innerHTML: date.lower_text,
            class: "lower-text",
            append_to: this.layers.date
          });
          if (date.upper_text) {
            const $upper_text = createSVG("text", {
              x: date.upper_x,
              y: date.upper_y,
              innerHTML: date.upper_text,
              class: "upper-text",
              append_to: this.layers.date
            });
            if ($upper_text.getBBox().x2 > this.layers.grid.getBBox().width) {
              $upper_text.remove();
            }
          }
        }
      }
      get_dates_to_draw() {
        let last_date = null;
        const dates = this.dates.map((date, i) => {
          const d = this.get_date_info(date, last_date, i);
          last_date = date;
          return d;
        });
        return dates;
      }
      get_date_info(date, last_date, i) {
        if (!last_date) {
          last_date = date_utils.add(date, 1, "year");
        }
        const date_text = {
          "Quarter Day_lower": date_utils.format(
            date,
            "HH",
            this.options.language
          ),
          "Half Day_lower": date_utils.format(date, "HH", this.options.language),
          Day_lower: date.getDate() !== last_date.getDate() ? date_utils.format(date, "D", this.options.language) : "",
          Week_lower: date.getMonth() !== last_date.getMonth() ? date_utils.format(date, "D MMM", this.options.language) : date_utils.format(date, "D", this.options.language),
          Month_lower: date_utils.format(date, "MMMM", this.options.language),
          Year_lower: date_utils.format(date, "YYYY", this.options.language),
          "Quarter Day_upper": date.getDate() !== last_date.getDate() ? date_utils.format(date, "D MMM", this.options.language) : "",
          "Half Day_upper": date.getDate() !== last_date.getDate() ? date.getMonth() !== last_date.getMonth() ? date_utils.format(date, "D MMM", this.options.language) : date_utils.format(date, "D", this.options.language) : "",
          Day_upper: date.getMonth() !== last_date.getMonth() ? date_utils.format(date, "MMMM", this.options.language) : "",
          Week_upper: date.getMonth() !== last_date.getMonth() ? date_utils.format(date, "MMMM", this.options.language) : "",
          Month_upper: date.getFullYear() !== last_date.getFullYear() ? date_utils.format(date, "YYYY", this.options.language) : "",
          Year_upper: date.getFullYear() !== last_date.getFullYear() ? date_utils.format(date, "YYYY", this.options.language) : ""
        };
        const base_pos = {
          x: i * this.options.column_width,
          lower_y: this.options.header_height,
          upper_y: this.options.header_height - 25
        };
        const x_pos = {
          "Quarter Day_lower": this.options.column_width * 4 / 2,
          "Quarter Day_upper": 0,
          "Half Day_lower": this.options.column_width * 2 / 2,
          "Half Day_upper": 0,
          Day_lower: this.options.column_width / 2,
          Day_upper: this.options.column_width * 30 / 2,
          Week_lower: 0,
          Week_upper: this.options.column_width * 4 / 2,
          Month_lower: this.options.column_width / 2,
          Month_upper: this.options.column_width * 12 / 2,
          Year_lower: this.options.column_width / 2,
          Year_upper: this.options.column_width * 30 / 2
        };
        return {
          upper_text: date_text[`${this.options.view_mode}_upper`],
          lower_text: date_text[`${this.options.view_mode}_lower`],
          upper_x: base_pos.x + x_pos[`${this.options.view_mode}_upper`],
          upper_y: base_pos.upper_y,
          lower_x: base_pos.x + x_pos[`${this.options.view_mode}_lower`],
          lower_y: base_pos.lower_y
        };
      }
      make_bars() {
        this.bars = this.tasks.map((task) => {
          const bar = new Bar(this, task);
          this.layers.bar.appendChild(bar.group);
          return bar;
        });
      }
      make_arrows() {
        this.arrows = [];
        for (let task of this.tasks) {
          let arrows = [];
          arrows = task.dependencies.map((task_id) => {
            const dependency = this.get_task(task_id);
            if (!dependency)
              return;
            const arrow = new Arrow(
              this,
              this.bars[dependency._index],
              this.bars[task._index]
            );
            this.layers.arrow.appendChild(arrow.element);
            return arrow;
          }).filter(Boolean);
          this.arrows = this.arrows.concat(arrows);
        }
      }
      map_arrows_on_bars() {
        for (let bar of this.bars) {
          bar.arrows = this.arrows.filter((arrow) => {
            return arrow.from_task.task.id === bar.task.id || arrow.to_task.task.id === bar.task.id;
          });
        }
      }
      set_width() {
        const cur_width = this.$svg.getBoundingClientRect().width;
        const actual_width = this.$svg.querySelector(".grid .grid-row").getAttribute("width");
        if (cur_width < actual_width) {
          this.$svg.setAttribute("width", actual_width);
        }
      }
      set_scroll_position() {
        const parent_element = this.$svg.parentElement;
        if (!parent_element)
          return;
        const hours_before_first_task = date_utils.diff(
          this.get_oldest_starting_date(),
          this.gantt_start,
          "hour"
        );
        const scroll_pos = hours_before_first_task / this.options.step * this.options.column_width - this.options.column_width;
        parent_element.scrollLeft = scroll_pos;
      }
      bind_grid_click() {
        $.on(
          this.$svg,
          this.options.popup_trigger,
          ".grid-row, .grid-header",
          () => {
            this.unselect_all();
            this.hide_popup();
          }
        );
      }
      bind_bar_events() {
        let is_dragging = false;
        let x_on_start = 0;
        let y_on_start = 0;
        let is_resizing_left = false;
        let is_resizing_right = false;
        let parent_bar_id = null;
        let bars = [];
        this.bar_being_dragged = null;
        function action_in_progress() {
          return is_dragging || is_resizing_left || is_resizing_right;
        }
        $.on(this.$svg, "mousedown", ".bar-wrapper, .handle", (e, element) => {
          const bar_wrapper = $.closest(".bar-wrapper", element);
          if (element.classList.contains("left")) {
            is_resizing_left = true;
          } else if (element.classList.contains("right")) {
            is_resizing_right = true;
          } else if (element.classList.contains("bar-wrapper")) {
            is_dragging = true;
          }
          bar_wrapper.classList.add("active");
          x_on_start = e.clientX;
          y_on_start = e.clientY;
          parent_bar_id = bar_wrapper.getAttribute("data-id");
          const ids = [
            parent_bar_id,
            ...this.get_all_dependent_tasks(parent_bar_id)
          ];
          bars = ids.map((id) => this.get_bar(id));
          this.bar_being_dragged = parent_bar_id;
          bars.forEach((bar) => {
            const $bar = bar.$bar;
            $bar.ox = $bar.getX();
            $bar.oy = $bar.getY();
            $bar.owidth = $bar.getWidth();
            $bar.finaldx = 0;
          });
        });
        $.on(this.$svg, "mousemove", (e) => {
          if (!action_in_progress())
            return;
          const dx = e.clientX - x_on_start;
          const dy = e.clientY - y_on_start;
          bars.forEach((bar) => {
            const $bar = bar.$bar;
            $bar.finaldx = this.get_snap_position(dx);
            if (is_resizing_left) {
              if (parent_bar_id == bar.task.id) {
                bar.update_bar_position({
                  x: $bar.ox + $bar.finaldx,
                  width: $bar.owidth - $bar.finaldx
                });
              } else {
                bar.update_bar_position({
                  x: $bar.ox + $bar.finaldx
                });
              }
            } else if (is_resizing_right) {
              if (parent_bar_id == bar.task.id) {
                bar.update_bar_position({
                  width: $bar.owidth + $bar.finaldx
                });
              }
            } else if (is_dragging) {
              bar.update_bar_position({ x: $bar.ox + $bar.finaldx });
            }
          });
        });
        document.addEventListener("mouseup", (e) => {
          if (is_dragging || is_resizing_left || is_resizing_right) {
            bars.forEach((bar) => bar.group.classList.remove("active"));
          }
          is_dragging = false;
          is_resizing_left = false;
          is_resizing_right = false;
        });
        $.on(this.$svg, "mouseup", (e) => {
          this.bar_being_dragged = null;
          bars.forEach((bar) => {
            const $bar = bar.$bar;
            if (!$bar.finaldx)
              return;
            bar.date_changed();
            bar.set_action_completed();
          });
        });
        this.bind_bar_progress();
      }
      bind_bar_progress() {
        let x_on_start = 0;
        let y_on_start = 0;
        let is_resizing = null;
        let bar = null;
        let $bar_progress = null;
        let $bar = null;
        $.on(this.$svg, "mousedown", ".handle.progress", (e, handle) => {
          is_resizing = true;
          x_on_start = e.clientX;
          y_on_start = e.clientY;
          const $bar_wrapper = $.closest(".bar-wrapper", handle);
          const id = $bar_wrapper.getAttribute("data-id");
          bar = this.get_bar(id);
          $bar_progress = bar.$bar_progress;
          $bar = bar.$bar;
          $bar_progress.finaldx = 0;
          $bar_progress.owidth = $bar_progress.getWidth();
          $bar_progress.min_dx = -$bar_progress.getWidth();
          $bar_progress.max_dx = $bar.getWidth() - $bar_progress.getWidth();
        });
        $.on(this.$svg, "mousemove", (e) => {
          if (!is_resizing)
            return;
          let dx = e.clientX - x_on_start;
          let dy = e.clientY - y_on_start;
          if (dx > $bar_progress.max_dx) {
            dx = $bar_progress.max_dx;
          }
          if (dx < $bar_progress.min_dx) {
            dx = $bar_progress.min_dx;
          }
          const $handle = bar.$handle_progress;
          $.attr($bar_progress, "width", $bar_progress.owidth + dx);
          $.attr($handle, "points", bar.get_progress_polygon_points());
          $bar_progress.finaldx = dx;
        });
        $.on(this.$svg, "mouseup", () => {
          is_resizing = false;
          if (!($bar_progress && $bar_progress.finaldx))
            return;
          bar.progress_changed();
          bar.set_action_completed();
        });
      }
      get_all_dependent_tasks(task_id) {
        let out = [];
        let to_process = [task_id];
        while (to_process.length) {
          const deps = to_process.reduce((acc, curr) => {
            acc = acc.concat(this.dependency_map[curr]);
            return acc;
          }, []);
          out = out.concat(deps);
          to_process = deps.filter((d) => !to_process.includes(d));
        }
        return out.filter(Boolean);
      }
      get_snap_position(dx) {
        let odx = dx, rem, position;
        if (this.view_is("Week")) {
          rem = dx % (this.options.column_width / 7);
          position = odx - rem + (rem < this.options.column_width / 14 ? 0 : this.options.column_width / 7);
        } else if (this.view_is("Month")) {
          rem = dx % (this.options.column_width / 30);
          position = odx - rem + (rem < this.options.column_width / 60 ? 0 : this.options.column_width / 30);
        } else {
          rem = dx % this.options.column_width;
          position = odx - rem + (rem < this.options.column_width / 2 ? 0 : this.options.column_width);
        }
        return position;
      }
      unselect_all() {
        [...this.$svg.querySelectorAll(".bar-wrapper")].forEach((el) => {
          el.classList.remove("active");
        });
      }
      view_is(modes) {
        if (typeof modes === "string") {
          return this.options.view_mode === modes;
        }
        if (Array.isArray(modes)) {
          return modes.some((mode) => this.options.view_mode === mode);
        }
        return false;
      }
      get_task(id) {
        return this.tasks.find((task) => {
          return task.id == parseInt(id);
        });
      }
      get_bar(id) {
        return this.bars.find((bar) => {
          return bar.task.id == parseInt(id);
        });
      }
      show_popup(options) {
        if (!this.popup) {
          this.popup = new Popup(
            this.popup_wrapper,
            this.options.custom_popup_html
          );
        }
        this.popup.show(options);
      }
      hide_popup() {
        this.popup && this.popup.hide();
      }
      trigger_event(event, args) {
        if (this.options["on_" + event]) {
          this.options["on_" + event].apply(null, args);
        }
      }
      get_oldest_starting_date() {
        return this.tasks.map((task) => task._start).reduce(
          (prev_date, cur_date) => cur_date <= prev_date ? cur_date : prev_date
        );
      }
      clear() {
        this.$svg.innerHTML = "";
      }
    }
    function generate_id(task) {
      return task.name + "_" + Math.random().toString(36).slice(2, 12);
    }
    return Gantt2;
  }();

  // private/gantt.js
  function createGantt(tasks, userLang = "en", zoomMode = "Day") {
    let lang = userLang.slice(0, 2);
    var gantt2 = new Gantt("#GanttChart", tasks, {
      header_height: 50,
      column_width: 30,
      step: 24,
      view_modes: ["Quarter Day", "Half Day", "Day", "Week", "Month"],
      bar_height: 30,
      bar_corner_radius: 3,
      arrow_curve: 5,
      padding: 18,
      view_mode: zoomMode,
      date_format: "YYYY-MM-DD",
      custom_popup_html: null,
      custom_class: "bar-red",
      language: lang,
      on_click: function(task) {
      },
      on_date_change: function(task, start2, end) {
        task.setDueDateAndDuration(start2, end);
      },
      on_progress_change: function(task, progress) {
        task.setProgress(progress);
      },
      on_view_change: function(mode) {
      }
    });
    window.gantt = gantt2;
  }

  // private/decks.js
  var zoomOptionTranslations = {
    en: ["Quarter Day", "Half Day", "Day", "Week", "Month", "Year"],
    de: ["Viertel Tag", "Halber Tag", "Tag", "Woche", "Monat", "Jahr"]
  };
  var defaultZoomMode = "Day";
  var decks_default = () => ({
    toggle() {
      let deckNav = document.getElementById("DeckNav");
      let DeckSelection = document.getElementById("DeckSelection");
      let width = deckNav.offsetWidth;
      if (!DeckSelection.style.transform) {
        DeckSelection.style.transform = `translateX(-${width}px)`;
      } else {
        DeckSelection.style.transform = "";
      }
    },
    close() {
      let deckNav = document.getElementById("DeckNav");
      let width = deckNav.offsetWidth;
      let DeckSelection = document.getElementById("DeckSelection");
      DeckSelection.style.transform = `translateX(-${width}px)`;
    },
    init() {
      checkBaseUri();
      loggedOutView();
      setZoomSelectOptions(this.userLang);
    },
    loadDecks() {
      let credentials = getCredentials();
      let url = conf_default.NC_URL + conf_default.BOARD_ENDPOINT;
      fetch(url, {
        method: "GET",
        headers: {
          Authorization: "Basic " + credentials
        }
      }).then((response) => {
        if (response.status === 401) {
          loggedOutView();
        } else if (response.status === 200) {
          this.decks = response.json();
          loggedInView();
          document.getElementById("LoadingOverlay").classList.remove("z-30");
          document.getElementById("LoadingOverlay").classList.remove("z-10");
        } else {
          loggedOutView();
        }
        if (response.status !== 200) {
          setErrorMessage(response, translate("wrongPassword", this.userLang));
        }
        this.currentDeck = {};
        this.currentDeck.cards = [];
      }).catch((error2) => {
        setErrorMessage(error2, translate("wrongPassword", this.userLang));
      });
    },
    openDeck(id, name) {
      loadDeck(id).then((cards) => {
        loggedInView();
        this.currentDeck.name = name;
        this.currentDeck.cards = cards;
        this.currentDeck.id = id;
        let scheduledTasks = this.getScheduledTasks();
        if (scheduledTasks.length > 0) {
          let zoomMode = getZoomLevelFromCookie(name) || "Day";
          createGantt(this.getScheduledTasks(), this.userLang, zoomMode);
          document.getElementById("ZoomSelect").value = zoomMode;
        }
      }).finally(() => {
        this.close();
      });
    },
    getCurrentDeckCards() {
      return this.currentDeck.cards;
    },
    getCurrentDeckName() {
      return this.currentDeck.name;
    },
    getUnscheduledTasks() {
      return filterUnscheduledTasks(this.currentDeck.cards);
    },
    getScheduledTasks() {
      return filterScheduledTasks(this.currentDeck.cards);
    },
    getDecks() {
      return this.decks;
    },
    logIn() {
      this.hideError();
      this.loadDecks();
    },
    setZoom(event) {
      const selectedValue = event.target.value;
      gantt.change_view_mode(selectedValue);
      document.cookie = "Deck." + this.currentDeck.name + ".zoom=" + selectedValue;
    },
    hideError,
    currentDeck: {},
    userLang: navigator.language || navigator.userLanguage
  });
  async function loadDeck(id) {
    loadingView();
    this.currentDeck = null;
    let credentials = getCredentials();
    let url = conf_default.NC_URL + conf_default.BOARD_ENDPOINT + "/" + id + "/stacks";
    let response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: "Basic " + credentials
      }
    });
    if (response.status === 200) {
      return createTasks(await response.json(), id);
    } else {
      setErrorMessage(response, "Could not load Decks");
    }
  }
  function loadingView() {
    document.getElementById("Login").classList.add("hidden");
    document.getElementById("MainContent").classList.add("hidden");
    document.getElementById("LoadingOverlay").classList.remove("hidden");
    hideError();
  }
  function loggedInView() {
    document.getElementById("Login").classList.add("hidden");
    document.getElementById("DeckSelection").classList.remove("hidden");
    document.getElementById("MainContent").classList.remove("hidden");
    document.getElementById("LoadingOverlay").classList.add("hidden");
  }
  function loggedOutView() {
    document.getElementById("DeckSelection").classList.add("hidden");
    document.getElementById("Login").classList.remove("hidden");
    document.getElementById("LoadingOverlay").classList.add("hidden");
    document.getElementById("LoginText").innerText = translate(
      "loginText",
      navigator.language || navigator.userLanguage
    );
  }
  function setErrorMessage(response, customMessage = "") {
    let errorMessage = customMessage + "<br>ErrorCode: " + response.status;
    if (response.message) {
      errorMessage += "<br>" + response.message;
    }
    document.getElementById("ErrorArea").innerHTML = errorMessage;
    document.getElementById("ErrorWrapper").classList.remove("hidden");
  }
  function hideError() {
    document.getElementById("ErrorWrapper").classList.add("hidden");
  }
  function checkBaseUri() {
    let url = conf_default.NC_URL + conf_default.BOARD_ENDPOINT;
    fetch(url, {
      method: "GET",
      headers: {
        Authorization: "Basic dummycredentials"
      }
    }).catch(() => {
      setErrorMessage(
        [(status) => null],
        translate("wrongUri", navigator.language || navigator.userLanguage) + conf_default.NC_URL
      );
    });
  }
  function setZoomSelectOptions(lang) {
    let zoomOptions = zoomOptionTranslations[lang] || zoomOptionTranslations["en"];
    let zoomSelect = document.getElementById("ZoomSelect");
    zoomOptions.map((value, index) => {
      const optionElement = document.createElement("option");
      optionElement.value = zoomOptionTranslations["en"][index];
      optionElement.textContent = value;
      zoomSelect.appendChild(optionElement);
    });
    zoomSelect.value = defaultZoomMode;
  }
  function getZoomLevelFromCookie(deckName) {
    const cookieName = "Deck." + deckName + ".zoom";
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.startsWith(cookieName + "=")) {
        return cookie.substring(cookieName.length + 1);
      }
    }
    return null;
  }

  // private/main.js
  window.Alpine = module_default;
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("Body").style.display = null;
    let deckNav = document.getElementById("DeckNav");
    let navTab = document.getElementById("NavTab");
    let zoomSelect = document.getElementById("ZoomSelect");
  });
  document.addEventListener("alpine:init", () => {
    module_default.store("decks", decks_default);
  });
  module_default.start();
})();
//# sourceMappingURL=main.js.map
