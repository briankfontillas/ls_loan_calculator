const HTTP = require("http");
const URL = require("url").URL;
const HANDLEBARS = require("handlebars");
const FS = require('fs');
const QUERYSTRING = require('querystring');
const PATH = require('path');
const PORT = 3000;
const APR = 5;
const MIME_TYPES = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const FORM_PAGE = 
`
<!DOCTYPE html>
<html lang="en-US">
  <head>
    <meta charset="utf-8">
    <title>Loan Calculator Form</title>
    <link rel="stylesheet" href="./assets/css/styles.css">
  </head>
  <body>
    <article>
      <h1>Loan Calculator</h1>
      <form action="/loan-offer" method="post">
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
    <link rel="stylesheet" href="./assets/css/styles.css">
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

function parseFormData(request, callback) {
  let body = '';
  request.on('data', chunk => {
    body += chunk.toString();
  });
  request.on('end', () => {
    let data = QUERYSTRING.parse(body);
    data.amount = Number(data.amount);
    data.duration = Number(data.duration);
    callback(data);
  });
}

function getParams(path) {
  const myURL = new URL(path, `http://localhost:${PORT}`);
  let searchParams = myURL.searchParams;
  let data = {};

  data.amount = Number(searchParams.get('amount'));
  data.duration = Number(searchParams.get('duration'));

  return data;
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

function createLoanOffer(data) {
  data.amountIncrement = data.amount + 100;
  data.amountDecrement = data.amount - 100;
  data.durationIncrement = data.duration + 1;
  data.durationDecrement = data.duration - 1;
  data.apr = APR;
  data.payment = calculateLoan(data.amount, data.duration, APR);

  return data;
}

SERVER = HTTP.createServer((req, res) => {
  let path = req.url;
  let pathname = getPathname(path);
  let fileExtension = PATH.extname(pathname);

  FS.readFile(`./public/${pathname}`, (err, data) => {
    if (data) {
      res.statusCode = 200;
      res.setHeader('Content-Type', `${MIME_TYPES[fileExtension]}`);
      res.write(`${data}\n`);
      res.end();
    } else {
      let method = req.method;
      if (method === 'GET' && pathname === '/') {
        let content = render(FORM_TEMPLATE, {apr: APR});
    
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.write(`${content}\n`);
        res.end();
      } else if (method === 'GET' && pathname === '/loan-offer') {
        let data = createLoanOffer(getParams(path));
        let content = render(LOAN_TEMPLATE, data);
    
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.write(`${content}\n`);
        res.end();
      } else if (method === 'POST' && pathname === '/loan-offer') {
        parseFormData(req, parsedData => {
          let data = createLoanOffer(parsedData);
          let content = render(LOAN_TEMPLATE, data);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html');
          res.write(`${content}\n`);
          res.end();
        });
      } else {
        res.statusCode = 404;
        res.end();
      }
    }
  })
});

SERVER.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});