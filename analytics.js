(function setupAnalytics() {
  const measurementId = "G-NM1SY02HE3";

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", measurementId, { cookie_domain: "none" });

  window.trackGameEvent = function trackGameEvent(eventName, workId) {
    if (!workId) return;
    window.gtag("event", eventName, { work_id: workId });
  };
})();
