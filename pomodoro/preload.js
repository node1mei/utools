window.setPomodoroData = function() {
  const date = new Date();
  const id = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const data = utools.db.get(id);
  if (data) {
    utools.db.put({...data, value: data.value + 1});
  } else {
    utools.db.put({
      _id: id,
      value: 1,
    });
  }
}

window.getPomodoroData = function(date) {
  const id = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const data = utools.db.get(id);
  return data ? data.value : 0;
}

window.showNotification = function(body) {
  utools.showNotification(body, 'pomodoro', slient=false);
}

utools.onPluginReady(() => {
  vm.completedPomodoro = getPomodoroData(new Date());
});