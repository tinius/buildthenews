savingsCalculator = function() {
  div = document.getElementById('output')

  x = parseInt(document.getElementById('user_guess').value)
  q = 1.005

  var result = Math.round((Math.log(  ((q - 1) * 62500) / x + 1)/Math.log(q))/12)

  div.innerHTML = 'It would take you ' +result+ ' years to save the &pound;62,500 needed to settle your spouse in the UK'

  console.log(result)
  return false;
};
