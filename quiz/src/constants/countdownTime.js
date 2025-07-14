const COUNTDOWN_TIME = {
  hours: [],
  minutes: [],
  seconds: [],
};

for (let i = 0; i < 100; i++) {
  COUNTDOWN_TIME.hours.push({ key: i, text: i.toString(), value: i }); // ✅ just i
}

for (let i = 0; i < 60; i++) {
  COUNTDOWN_TIME.minutes.push({ key: i, text: i.toString(), value: i }); // ✅ just i
}

for (let i = 0; i < 60; i++) {
  COUNTDOWN_TIME.seconds.push({ key: i, text: i.toString(), value: i }); // ✅ just i
}

export default COUNTDOWN_TIME;
