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

  var initCopyEditor = function () {
    var params = new URLSearchParams(window.location.search || "");
    var localHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname === "::1";
    if (!localHost || params.get("dev") !== "1" || !window.fetch) {
      return;
    }

    fetch("/__copy/status", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("copy editor unavailable");
        }
        return response.json();
      })
      .then(function (status) {
        if (!status || !status.ok) {
          return;
        }
        var allCopyElements = document.querySelectorAll("[data-copy-id]");
        var copyElements = [];
        var isEditorExcludedCopy = function (element) {
          return Boolean(element.closest("a.button, button, .floating-donate, .nav-donate, .site-nav, [data-curator-demo], .curator-demo-grid"));
        };
        var sameSiteUrl = function (anchor) {
          var href = anchor.getAttribute("href") || "";
          if (!href || href === "#" || anchor.hasAttribute("data-pending-link")) {
            return null;
          }
          try {
            var url = new URL(href, window.location.href);
            if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol)) {
              return null;
            }
            return url;
          } catch (error) {
            return null;
          }
        };

        for (var i = 0; i < allCopyElements.length; i += 1) {
          if (!isEditorExcludedCopy(allCopyElements[i])) {
            copyElements.push(allCopyElements[i]);
          }
        }

        if (!copyElements.length) {
          return;
        }
        document.body.classList.add("copy-editor-enabled");

        var dirty = false;
        var statusText = null;
        var setDirty = function (value) {
          dirty = value;
          document.body.classList.toggle("copy-editor-dirty", dirty);
        };
        var copyText = function (element) {
          var field = element._copyField;
          var text = field ? field.value : element.innerText;
          return text.replace(/\u00a0/g, " ").trim();
        };
        var sizeField = function (field) {
          if (!field) {
            return;
          }
          field.style.height = "auto";
          field.style.height = Math.max(field.scrollHeight, 28) + "px";
        };
        var hasDirtyElements = function () {
          for (var d = 0; d < copyElements.length; d += 1) {
            if (copyElements[d].hasAttribute("data-copy-dirty")) {
              return true;
            }
          }
          return false;
        };
        var syncElement = function (element) {
          if (!element || !element.hasAttribute("data-copy-dirty")) {
            return Promise.resolve({ skipped: true });
          }
          if (element._copySyncPromise) {
            return element._copySyncPromise;
          }
          element.setAttribute("data-copy-syncing", "true");
          if (statusText) {
            statusText.textContent = "Syncing copy file";
          }
          element._copySyncPromise = fetch("/__copy/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: element.getAttribute("data-copy-id"),
              text: copyText(element)
            })
          })
            .then(function (response) {
              return response.json().then(function (payload) {
                if (!response.ok || !payload || payload.ok === false) {
                  throw new Error(payload && payload.error ? payload.error : "sync failed");
                }
                return payload;
              });
            })
            .then(function (payload) {
              element.removeAttribute("data-copy-dirty");
              element.removeAttribute("data-copy-syncing");
              element.setAttribute("data-copy-original", copyText(element));
              element._copySyncPromise = null;
              setDirty(hasDirtyElements());
              if (statusText) {
                statusText.textContent = "Copy synced";
              }
              return payload;
            })
            .catch(function (error) {
              element.removeAttribute("data-copy-syncing");
              element._copySyncPromise = null;
              if (statusText) {
                statusText.textContent = error.message || "Sync failed";
              }
              throw error;
            });
          return element._copySyncPromise;
        };
        var syncDirtyElements = function () {
          var sequence = Promise.resolve();
          for (var s = 0; s < copyElements.length; s += 1) {
            if (copyElements[s].hasAttribute("data-copy-dirty")) {
              (function (element) {
                sequence = sequence.then(function () {
                  return syncElement(element);
                });
              })(copyElements[s]);
            }
          }
          return sequence;
        };

        for (var i = 0; i < copyElements.length; i += 1) {
          var element = copyElements[i];
          var originalText = element.innerText.replace(/\u00a0/g, " ").trim();
          var field = document.createElement("textarea");
          field.className = "copy-editor-field";
          field.value = originalText;
          field.setAttribute("aria-label", "Edit copy");
          field.setAttribute("rows", "1");
          field.setAttribute("spellcheck", "true");
          element.setAttribute("data-copy-editable", "true");
          element.setAttribute("data-copy-original", originalText);
          element.innerHTML = "";
          element.appendChild(field);
          element._copyField = field;
          sizeField(field);
          field.addEventListener("input", function () {
            var host = this.closest("[data-copy-editable]");
            sizeField(this);
            if (host) {
              host.setAttribute("data-copy-dirty", "true");
            }
            setDirty(true);
          });
          field.addEventListener("blur", function () {
            var host = this.closest("[data-copy-editable]");
            if (host) {
              syncElement(host).catch(function () {});
            }
          });
        }

        document.addEventListener("focusout", function (event) {
          var editable = event.target.closest && event.target.closest("[data-copy-editable]");
          if (editable && event.target !== editable._copyField) {
            syncElement(editable).catch(function () {});
          }
        });

        document.addEventListener("click", function (event) {
          var editable = event.target.closest && event.target.closest("[data-copy-editable]");
          if (editable && editable.closest("a")) {
            event.preventDefault();
            return;
          }

          var anchor = event.target.closest && event.target.closest("a[href]");
          var url = anchor ? sameSiteUrl(anchor) : null;
          if (url) {
            url.searchParams.set("dev", "1");
            event.preventDefault();
            window.location.href = url.pathname + url.search + url.hash;
          }
        });

        var bar = document.createElement("div");
        bar.className = "copy-editor-bar";
        bar.innerHTML = '<button class="copy-editor-save" type="button">Save copy</button><span class="copy-editor-status" aria-live="polite"></span>';
        document.body.appendChild(bar);

        var saveButton = bar.querySelector(".copy-editor-save");
        statusText = bar.querySelector(".copy-editor-status");
        saveButton.addEventListener("click", function () {
          saveButton.disabled = true;
          saveButton.textContent = "Saving...";
          statusText.textContent = "Syncing copy files";
          syncDirtyElements()
            .then(function () {
              statusText.textContent = "Running checks";
              return fetch("/__copy/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: "{}"
              });
            })
            .then(function (response) {
              return response.json().then(function (payload) {
                if (!response.ok || !payload || payload.ok === false) {
                  throw new Error(payload && payload.error ? payload.error : "save failed");
                }
                return payload;
              });
            })
            .then(function (payload) {
              setDirty(false);
              saveButton.textContent = "Saved";
              if (payload.pushed) {
                statusText.textContent = "Committed and pushed " + payload.commit;
              } else if (payload.pushBlocked) {
                statusText.textContent = payload.reason || "Committed locally. Push pending.";
              } else if (payload.blocked) {
                statusText.textContent = payload.reason || "Saved locally. Commit blocked.";
              } else if (payload.committed) {
                statusText.textContent = "Committed locally " + payload.commit;
              } else {
                statusText.textContent = payload.changed ? "Saved locally" : "No copy changes";
              }
              window.setTimeout(function () {
                saveButton.textContent = "Save copy";
                saveButton.disabled = false;
              }, 1200);
            })
            .catch(function (error) {
              saveButton.textContent = "Save copy";
              saveButton.disabled = false;
              statusText.textContent = error.message || "Save failed";
            });
        });
      })
      .catch(function () {});
  };

  initCopyEditor();

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
    var header = document.querySelector("[data-site-header]");
    var heroDonate = document.querySelector(".hero [data-page-donate]");
    var floatingDonateGap = 16;
    var donateTargets = [];
    var buttons = document.querySelectorAll("a.button");
    for (var j = 0; j < buttons.length; j += 1) {
      var button = buttons[j];
      var isDonate = button.hasAttribute("data-donate-button") || button.textContent.trim().toLowerCase() === "donate";
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
      if (heroDonate) {
        var heroDonateRect = heroDonate.getBoundingClientRect();
        var headerBottom = header ? header.getBoundingClientRect().bottom : 0;
        document.body.classList.toggle("hero-donate-passed", heroDonateRect.bottom <= headerBottom);
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
    window.addEventListener("load", requestDonateHandoff);
    window.addEventListener("hashchange", requestDonateHandoff);
    updateDonateHandoff();
    window.setTimeout(requestDonateHandoff, 80);
  }
})();
