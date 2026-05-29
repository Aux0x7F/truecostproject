(function () {
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (callback) {
      return window.setTimeout(callback, 16);
    };
  }

  if (window.Element && !Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  }

  if (window.Element && !Element.prototype.closest) {
    Element.prototype.closest = function (selector) {
      var node = this;
      while (node && node.nodeType === 1) {
        if (node.matches(selector)) {
          return node;
        }
        node = node.parentElement || node.parentNode;
      }
      return null;
    };
  }

  var nav = document.querySelector("[data-site-nav]");
  var toggle = document.querySelector("[data-menu-toggle]");
  var page = document.body.getAttribute("data-page");
  var floatingDonate = document.querySelector(".floating-donate");
  var performanceNow = function () {
    return window.performance && window.performance.now ? window.performance.now() : Date.now();
  };

  if (nav && toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.addEventListener("click", function (event) {
      if (event.target && event.target.tagName === "A") {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (page) {
    var active = document.querySelector('[data-nav="' + page + '"]');
    if (active) {
      active.setAttribute("aria-current", "page");
    }
  }

  var pendingLinks = document.querySelectorAll("[data-pending-link]");
  for (var i = 0; i < pendingLinks.length; i += 1) {
    pendingLinks[i].addEventListener("click", function (event) {
      event.preventDefault();
    });
  }

  var buttonHoverTargets = document.querySelectorAll(".button, .floating-donate");
  var enterButtonHover = function (event) {
    event.currentTarget.classList.add("button-hover");
  };
  var leaveButtonHover = function (event) {
    event.currentTarget.classList.remove("button-hover");
  };

  for (var b = 0; b < buttonHoverTargets.length; b += 1) {
    buttonHoverTargets[b].addEventListener("pointerenter", enterButtonHover);
    buttonHoverTargets[b].addEventListener("mouseenter", enterButtonHover);
    buttonHoverTargets[b].addEventListener("pointerleave", leaveButtonHover);
    buttonHoverTargets[b].addEventListener("mouseleave", leaveButtonHover);
  }

  var curatorHost = document.querySelector("[data-curator-feed]");
  if (curatorHost) {
    var curatorStart = performanceNow();
    var curatorMount = curatorHost.querySelector("[data-curator-mount]");
    var curatorDemo = curatorHost.querySelector("[data-curator-demo]");
    var curatorFeedId = String(curatorHost.getAttribute("data-curator-feed-id") || "").replace(/\s+/g, "");
    var curatorLayoutId = String(curatorHost.getAttribute("data-curator-layout-id") || "curator-feed-default-feed-layout").replace(/\s+/g, "");
    var safeIdPattern = /^[A-Za-z0-9_-]+$/;
    var markCurator = function (name) {
      var ms = Math.round(performanceNow() - curatorStart);
      curatorHost.setAttribute("data-" + name + "-ms", String(ms));
      if (window.console && console.info) {
        console.info("Curator " + name + " in " + ms + "ms");
      }
    };
    var hasCuratorContent = function () {
      return Boolean(curatorMount && curatorMount.querySelector(".crt-post, .crt-feed, .crt-grid, iframe, img, article"));
    };
    var setCuratorReady = function () {
      curatorHost.classList.add("is-curator-ready");
      curatorHost.classList.remove("is-curator-loading");
      if (curatorDemo) {
        curatorDemo.setAttribute("aria-hidden", "true");
      }
      markCurator("ready");
    };

    if (curatorFeedId) {
      if (safeIdPattern.test(curatorFeedId) && safeIdPattern.test(curatorLayoutId) && curatorMount) {
        curatorHost.classList.add("is-curator-loading");
        curatorMount.id = curatorLayoutId;
        curatorMount.setAttribute("aria-hidden", "false");
        curatorMount.innerHTML = '<a href="https://curator.io" target="_blank" rel="noopener" class="crt-logo crt-tag">Powered by Curator.io</a>';

        if (window.MutationObserver) {
          var curatorObserver = new MutationObserver(function () {
            if (hasCuratorContent()) {
              curatorObserver.disconnect();
              setCuratorReady();
            }
          });
          curatorObserver.observe(curatorMount, { childList: true, subtree: true });
        }

        var curatorScript = document.createElement("script");
        curatorScript.async = true;
        curatorScript.charset = "UTF-8";
        curatorScript.src = "https://cdn.curator.io/published/" + encodeURIComponent(curatorFeedId) + ".js";
        curatorScript.onload = function () {
          window.setTimeout(function () {
            if (hasCuratorContent() && !curatorHost.classList.contains("is-curator-ready")) {
              setCuratorReady();
            }
          }, 600);
        };
        curatorScript.onerror = function () {
          curatorHost.classList.remove("is-curator-loading");
          curatorHost.setAttribute("data-curator-error", "script");
          markCurator("fallback");
        };
        document.head.appendChild(curatorScript);
      } else {
        curatorHost.setAttribute("data-curator-error", "invalid-feed-id");
        markCurator("fallback");
      }
    } else {
      markCurator("demo");
    }
  }

  if (floatingDonate) {
    var footer = document.querySelector(".site-footer");
    var floatingDonateGap = 16;
    var donateTargets = [];
    var buttons = document.querySelectorAll("a.button");
    for (var j = 0; j < buttons.length; j += 1) {
      var button = buttons[j];
      var isDonate = button.textContent.trim().toLowerCase() === "donate";
      var inMenu = button.closest(".site-nav");
      var isFloating = button.classList.contains("floating-donate");
      if (isDonate && !inMenu && !isFloating) {
        donateTargets.push(button);
      }
    }

    var ticking = false;
    var updateDonateHandoff = function () {
      ticking = false;
      if (footer) {
        var footerRect = footer.getBoundingClientRect();
        var footerOffset = Math.max(floatingDonateGap, window.innerHeight - footerRect.top + floatingDonateGap);
        floatingDonate.style.setProperty("--floating-donate-bottom", footerOffset + "px");
      }

      var activeTarget = null;
      for (var k = 0; k < donateTargets.length; k += 1) {
        var target = donateTargets[k];
        var rect = target.getBoundingClientRect();
        var style = window.getComputedStyle(target);
        var visible = style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
        var inView = rect.top < window.innerHeight - 32 && rect.bottom > 32;
        if (visible && inView) {
          activeTarget = target;
          break;
        }
      }

      for (var l = 0; l < donateTargets.length; l += 1) {
        donateTargets[l].classList.toggle("donate-hint", donateTargets[l] === activeTarget);
      }
      floatingDonate.classList.toggle("is-absorbed", Boolean(activeTarget));
    };

    var requestDonateHandoff = function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateDonateHandoff);
      }
    };

    window.addEventListener("scroll", requestDonateHandoff, { passive: true });
    window.addEventListener("resize", requestDonateHandoff);
    updateDonateHandoff();
  }
})();
