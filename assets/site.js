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

  var instagramFeed = document.querySelector("[data-instagram-feed]");
  if (instagramFeed) {
    var feedStart = performanceNow();
    var feedUrl = instagramFeed.getAttribute("data-feed-url");
    var markFeed = function (name) {
      var ms = Math.round(performanceNow() - feedStart);
      instagramFeed.setAttribute("data-" + name + "-ms", String(ms));
      if (window.console && console.info) {
        console.info("Instagram " + name + " in " + ms + "ms");
      }
    };

    var sanitizeText = function (value) {
      return String(value || "")
        .replace(/\s+/g, " ")
        .trim();
    };

    var summarize = function (value) {
      var text = sanitizeText(value);
      if (text.length > 180) {
        return text.slice(0, 177).trim() + "...";
      }
      return text;
    };

    var bestImage = function (item) {
      var candidates = item && item.image_versions2 && item.image_versions2.candidates ? item.image_versions2.candidates : [];
      if (!candidates.length) {
        return "";
      }
      var selected = candidates[0];
      for (var c = 0; c < candidates.length; c += 1) {
        var candidate = candidates[c];
        if (Math.abs((candidate.width || 1) - (candidate.height || 1)) < 80) {
          selected = candidate;
          break;
        }
      }
      return selected.url || "";
    };

    var normalizeInstagramPayload = function (payload) {
      var items = payload && payload.items ? payload.items : [];
      var posts = [];
      for (var n = 0; n < items.length; n += 1) {
        var item = items[n];
        var code = sanitizeText(item.code);
        if (!code) {
          continue;
        }
        posts.push({
          id: sanitizeText(item.id || item.strong_id__ || code),
          code: code,
          permalink: "https://www.instagram.com/p/" + code + "/",
          summary: summarize(item.caption && item.caption.text ? item.caption.text : "View this post on Instagram."),
          image: bestImage(item),
          mediaType: item.media_type || null,
          timestamp: item.taken_at || null
        });
      }
      posts.sort(function (a, b) {
        return (b.timestamp || 0) - (a.timestamp || 0);
      });
      return {
        source: feedUrl,
        profileUrl: "https://www.instagram.com/truecostproject/",
        posts: posts
      };
    };

    var renderFallback = function (profileUrl) {
      instagramFeed.classList.add("is-loaded");
      instagramFeed.innerHTML = "";
      var fallback = document.createElement("a");
      fallback.className = "instagram-fallback";
      fallback.href = profileUrl || "https://www.instagram.com/truecostproject/";
      fallback.target = "_blank";
      fallback.rel = "noopener";
      fallback.textContent = "View @truecostproject on Instagram";
      instagramFeed.appendChild(fallback);
      markFeed("fallback");
    };

    var renderPosts = function (data) {
      var posts = data && data.posts ? data.posts : [];
      if (!posts.length) {
        renderFallback(data && data.profileUrl);
        return;
      }

      instagramFeed.classList.add("is-loaded");
      instagramFeed.innerHTML = "";
      var firstImagePending = true;

      for (var p = 0; p < posts.length; p += 1) {
        var post = posts[p];
        var tile = document.createElement("a");
        tile.className = "instagram-tile";
        tile.href = post.permalink || data.profileUrl || "https://www.instagram.com/truecostproject/";
        tile.target = "_blank";
        tile.rel = "noopener";

        if (post.image) {
          var image = document.createElement("img");
          image.src = post.image;
          image.alt = "";
          image.loading = p < 2 ? "eager" : "lazy";
          image.decoding = "async";
          image.addEventListener("load", function () {
            if (firstImagePending) {
              firstImagePending = false;
              markFeed("first-image");
            }
          });
          image.addEventListener("error", function (event) {
            event.currentTarget.parentNode.classList.add("is-missing-image");
            if (firstImagePending) {
              firstImagePending = false;
              markFeed("first-image-fallback");
            }
          });
          tile.appendChild(image);
        } else {
          tile.classList.add("is-missing-image");
        }

        var meta = document.createElement("span");
        meta.className = "instagram-meta";
        meta.textContent = post.mediaType === 2 ? "Reel" : "IG";
        tile.appendChild(meta);

        var summary = document.createElement("span");
        summary.className = "instagram-summary";
        summary.textContent = post.summary || "View this post on Instagram.";
        tile.appendChild(summary);
        instagramFeed.appendChild(tile);
      }

      markFeed("render");
      if (firstImagePending) {
        markFeed("first-image-fallback");
      }
    };

    if (feedUrl && window.XMLHttpRequest) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", feedUrl, true);
      xhr.setRequestHeader("Accept", "application/json");
      xhr.setRequestHeader("X-IG-App-ID", "936619743392459");
      xhr.onerror = function () {
        instagramFeed.setAttribute("data-feed-error", "cors-or-network");
        renderFallback();
      };
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) {
          return;
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            renderPosts(normalizeInstagramPayload(JSON.parse(xhr.responseText)));
          } catch (error) {
            instagramFeed.setAttribute("data-feed-error", "parse");
            renderFallback();
          }
        } else {
          instagramFeed.setAttribute("data-feed-error", xhr.status ? String(xhr.status) : "cors-or-network");
          renderFallback();
        }
      };
      xhr.send();
    } else {
      renderFallback();
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
