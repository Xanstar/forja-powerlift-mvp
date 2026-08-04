"use client";

import { useEffect } from "react";

const revealSelector = "[data-reveal]";

export function LandingRevealController() {
  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!("IntersectionObserver" in window) || motionPreference.matches) return;

    const elements = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));
    const pending = new Set<HTMLElement>();
    let observer: IntersectionObserver | undefined;
    let frameId: number | undefined;
    let initialized = false;
    let listening = false;

    const teardown = () => {
      observer?.disconnect();
      if (frameId !== undefined) cancelAnimationFrame(frameId);
      frameId = undefined;
      if (!listening) return;
      window.removeEventListener("scroll", scheduleScan);
      window.removeEventListener("resize", scheduleScan);
      window.removeEventListener("hashchange", revealHashTarget);
      listening = false;
    };

    const reveal = (targets: Iterable<HTMLElement>) => {
      for (const element of targets) {
        element.dataset.revealState = "revealed";
        pending.delete(element);
        observer?.unobserve(element);
      }

      if (initialized && pending.size === 0) teardown();
    };

    function scheduleScan() {
      if (frameId !== undefined || pending.size === 0) return;

      frameId = requestAnimationFrame(() => {
        frameId = undefined;
        const revealLine = window.innerHeight * 0.92;
        const passed = Array.from(pending).filter(
          (element) => element.getBoundingClientRect().top <= revealLine
        );
        reveal(passed);
      });
    }

    function revealHashTarget() {
      if (!window.location.hash) {
        scheduleScan();
        return;
      }

      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (!target) {
        scheduleScan();
        return;
      }

      const hashTargets = Array.from(target.querySelectorAll<HTMLElement>(revealSelector));
      if (target.matches(revealSelector)) hashTargets.push(target);
      reveal(hashTargets);
      scheduleScan();
    }

    observer = new IntersectionObserver(
      (entries) => {
        reveal(
          entries
            .filter((entry) => entry.isIntersecting)
            .map((entry) => entry.target as HTMLElement)
        );
      },
      { rootMargin: "0px 0px -8%", threshold: 0.12 }
    );

    const hashTarget = window.location.hash
      ? document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
      : null;
    const measurements = elements.map((element) => ({
      element,
      bounds: element.getBoundingClientRect(),
      hashTarget: Boolean(hashTarget?.contains(element)),
    }));
    const visible = measurements
      .filter(({ bounds, hashTarget: matchesHash }) =>
        matchesHash || bounds.top < window.innerHeight || bounds.bottom <= 0
      )
      .map(({ element }) => element);
    const belowFold = measurements
      .filter(({ element }) => !visible.includes(element))
      .map(({ element }) => element);

    reveal(visible);
    for (const element of belowFold) {
      element.dataset.revealState = "pending";
      pending.add(element);
      observer.observe(element);
    }

    initialized = true;
    listening = true;
    window.addEventListener("scroll", scheduleScan, { passive: true });
    window.addEventListener("resize", scheduleScan);
    window.addEventListener("hashchange", revealHashTarget);
    if (pending.size === 0) teardown();

    return teardown;
  }, []);

  return null;
}
