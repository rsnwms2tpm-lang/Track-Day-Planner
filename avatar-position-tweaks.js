(() => {
  const positions = {
    'driver-01': ['52%','57%'],
    'driver-02': ['50%','57%'],
    'driver-03': ['54%','57%'],
    'driver-04': ['55%','57%'],
    'driver-05': ['59%','58%'],
    'driver-06': ['59%','56%'],
    'driver-07': ['59%','58%'],
    'driver-08': ['59%','57%'],
    'driver-09': ['50%','58%'],
    'driver-10': ['51%','61%'],
    'driver-11': ['52%','58%'],
    'driver-12': ['53%','58%'],
    'driver-13': ['55%','58%'],
    'driver-14': ['59%','59%'],
    'driver-15': ['55%','58%'],
    'driver-16': ['61%','57%'],
    'helmet-01': ['45%','55%'],
    'helmet-02': ['48%','56%'],
    'helmet-03': ['50%','56%'],
    'helmet-04': ['51%','56%'],
    'helmet-05': ['44%','55%'],
    'helmet-06': ['50%','56%'],
    'helmet-07': ['47%','57%'],
    'helmet-08': ['57%','56%'],
    'helmet-09': ['46%','56%'],
    'helmet-10': ['45%','57%'],
    'helmet-11': ['52%','56%'],
    'helmet-12': ['59%','57%'],
    'helmet-13': ['44%','56%'],
    'helmet-14': ['49%','56%'],
    'helmet-15': ['53%','56%'],
    'helmet-16': ['58%','56%']
  };

  const style = document.createElement('style');
  style.id = 'avatar-position-tweaks';
  style.textContent = Object.entries(positions).map(([id,[x,y]]) =>
    `.avatar-option[data-avatar-id="${id}"] .tdp-avatar{background-position:${x} ${y}!important}`
  ).join('\n');
  document.head.appendChild(style);
})();
