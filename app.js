const HTTP = require("http");
const URL = require("url").URL;
const HANDLEBARS = require("handlebars");
const { loadavg } = require("os");
const PORT = 3000;
const APR = 5;

const FORM_PAGE = 
`
<!DOCTYPE html>
<html lang="en-US">
  <head>
    <meta charset="utf-8">
    <title>Loan Calculator Form</title>
    <style type="text/css">
      body {
        background: rgba(250, 250, 250);
        font-family: sans-serif;
        color: rgb(50, 50, 50);
      }

      article {
        width: 100%;
        max-width: 40rem;
        margin: 0 auto;
        padding: 1rem 2rem;
      }

      h1 {
        font-size: 2.5rem;
        text-align: center;
      }

      form, input {
        font-size: 1.5rem;
      }
      form p {
        text-align: center;
      }
      label, input {
        display: block;
        width: 100%;
        padding: 0.5rem;
        margin-top: 0.5rem;
      }
      input[type="number"] {
        border-radius: 0.3rem;
        border: 1px solid #cecece;
      }
      input[type="submit"] {
        width: auto;
        margin: 1rem auto;
        cursor: pointer;
        color: #fff;
        background-color: #01d28e;
        border: none;
        border-radius: 0.3rem;
      }
      input[type="submit"]:hover {
        background-color: #00a870;
      }
    </style>
  </head>
  <body>
    <article>
      <h1>Loan Calculator</h1>
      <form action="/loan-offer" method="get">
        <p>All loans are offered at an APR of {{apr}}%</p>
        <label for="amount">How much do you want to borrow (in dollars)?</label>
        <input type="number" name="amount" id="amount" value="" required>
        <label for="duration">How much time do you want to pay back your loan?</label>
        <input type="number" name="duration" id="duration" value="" required>
        <input type="submit" name="" value="Get loan offer!">
      </form>
    </article>
  </body>
</html>
`;

const LOAN_PAGE = 
`
<!DOCTYPE html>
<html lang="en-US">
  <head>
    <meta charset="utf-8">
    <title>Loan Calculator</title>
    <style type="text/css">
      body {
        background: rgba(250, 250, 250);
        font-family: sans-serif;
        color: rgb(50, 50, 50);
      }

      article {
        width: 100%;
        max-width: 40rem;
        margin: 0 auto;
        padding: 1rem 2rem;
      }

      h1 {
        font-size: 2.5rem;
        text-align: center;
      }

      table {
        font-size: 1.5rem;;
      }
      th {
        text-align: right;
      }
      td {
        text-align: center;
      }
      th, td {
        padding: 0.5rem;
      }
    </style>
  </head>
  <body>
    <article>
      <h1>Loan Calculator</h1>
      <table>
        <tbody>
          <tr>
            <th>Amount:</th>
            <td>
              <a href="/loan-offer?amount={{amountDecrement}}&duration={{duration}}">-$100</a>
            </td>
            <td>
            &#36;{{amount}}
            </td>
            <td>
              <a href="/loan-offer?amount={{amountIncrement}}&duration={{duration}}">+$100</a>
            </td>
          </tr>
          <tr>
            <th>Duration:</th>
            <td>
              <a href="/loan-offer?amount={{amount}}&duration={{durationDecrement}}">-1 Year</a>
            </td>
            <td>
              {{duration}} Year(s)
            </td>
            <td>
              <a href="/loan-offer?amount={{amount}}&duration={{durationIncrement}}">+1 Year</a>
            </td>
          </tr>
          <tr>
            <th>APR:</th>
            <td colspan="3">%{{apr}}</td>
          </tr>
          <tr>
            <th>Monthly payment:</th>
            <td colspan="3">&#36;{{payment}}</td>
          </tr>
        </tbody>
      </table>
    </article>
  </body>
</html>
`;

const FORM_TEMPLATE = HANDLEBARS.compile(FORM_PAGE);
const LOAN_TEMPLATE = HANDLEBARS.compile(LOAN_PAGE);

function render(template, data) {
  let html = template(data);
  return html;
}

function getParams(path) {
  const myURL = new URL(path, `http://localhost:${PORT}`);
  return myURL.searchParams;
}

function getPathname(path) {
  const myURL = new URL(path, `http://localhost${PORT}`);
  return myURL.pathname;
}

function calculateLoan(amount, duration, apr) {
  let annualInterestRate = apr / 100;
  let monthlyInterestRate = annualInterestRate / 12;
  let months = Number(duration) * 12;
  let payment = amount *
    (monthlyInterestRate /
    (1 - Math.pow((1 + monthlyInterestRate), (-months))));
  
  return payment.toFixed(2);
}

function calculateLoanOffer(params) {
  let data = {};

  data.amount = Number(params.get('amount'));
  data.amountIncrement = data.amount + 100;
  data.amountDecrement = data.amount - 100;
  data.duration = Number(params.get('duration'));
  data.durationIncrement = data.duration + 1;
  data.durationDecrement = data.duration - 1;
  data.apr = APR;
  data.payment = calculateLoan(data.amount, data.duration, APR);

  return data;
}

SERVER = HTTP.createServer((req, res) => {
  let path = req.url;
  let pathname = getPathname(path);

  if (pathname === '/') {
    let content = render(FORM_TEMPLATE, {apr: APR});

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.write(`${content}\n`);
    res.end();
  } else if (pathname === '/loan-offer') {
    let data = calculateLoanOffer(getParams(path));
    let content = render(LOAN_TEMPLATE, data);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.write(`${content}\n`);
    res.end();
  } else {
    res.statusCode = 404;
    res.end();
  }
});

SERVER.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});