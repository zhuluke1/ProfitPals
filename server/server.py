from flask import Flask, request, jsonify
import requests
from dotenv import load_dotenv
import os

import plaid
from plaid.api import plaid_api
from plaid.model.investments_holdings_get_request import InvestmentsHoldingsGetRequest
from plaid.model.plaid_error import PlaidError
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.exceptions import ApiException


# load environment variables from .env file
load_dotenv()


app = Flask(__name__)


PLAID_CLIENT_ID = os.getenv('PLAID_CLIENT_ID')
PLAID_SECRET = os.getenv('PLAID_SECRET')
PLAID_ENV = plaid.Environment.Sandbox if os.getenv('PLAID_ENV') == 'sandbox' else plaid.Environment.Production
PLAID_PRODUCTS = os.getenv('PLAID_PRODUCTS', 'investments').split(',')
PLAID_COUNTRY_CODES = os.getenv('PLAID_COUNTRY_CODES', 'US').split(',')


client = plaid_api.PlaidApi(plaid.ApiClient(
    plaid.Configuration(
        host=PLAID_ENV,
        api_key={
            'clientId': PLAID_CLIENT_ID,
            'secret': PLAID_SECRET,
        }
    )
))


@app.route('/create_link_token', methods=['POST'])
def create_link_token():
    try:
        request_data = LinkTokenCreateRequest(
            products=[Products(product) for product in PLAID_PRODUCTS],
            client_name="Jackpot",
            country_codes=[CountryCode(code) for code in PLAID_COUNTRY_CODES],
            language='en',
            user=LinkTokenCreateRequestUser(
                client_user_id='1'
            ),
            webhook='https://sample-web-hook.com',
            redirect_uri='https://secure.plaid.com/oauth/redirect'
        )
        response = client.link_token_create(request_data)
        return jsonify(response.to_dict())
    except ApiException as e:
        return jsonify({"error": str(e)}), 400
    # try:
    #     req_data = {
    #         "client_id": PLAID_CLIENT_ID,
    #         "secret": PLAID_SECRET,
    #         "user": {
    #             "client_user_id": "1",
    #             "email_address": "riyadev@umich.edu"
    #         },
    #         "products": ["investments"],
    #         "client_name": "Jackpot",
    #         "language": "en",
    #         "country_codes": ["US"],
    #         "webhook": "https://sample-web-hook.com",
    #         "redirect_uri": "https://secure.plaid.com/oauth/redirect"
    #     }

    #     headers = {
    #         'Content-Type': 'application/json'
    #     }

    #     response = requests.post('https://sandbox.plaid.com/link/token/create', json=req_data, headers=headers)
    #     response_data = response.json()

    #     if response.status_code != 200:
    #         return jsonify({"error": "Error creating link token"}), 500

    #     return jsonify({"link_token": response_data['link_token']})
    # except Exception as e:
    #     print(f"Error: {e}")
    #     return jsonify({"error": "Error creating link token"}), 500


# Exchange token flow - exchange a Link public_token for
# an API access_token
# https://plaid.com/docs/#exchange-token-flow

@app.route('/api/set_access_token', methods=['POST'])
def get_access_token():
    # global access_token
    # global item_id
    # global transfer_id
    # public_token = request.form['public_token']
    # try:
    #     exchange_request = ItemPublicTokenExchangeRequest(
    #         public_token=public_token)
    #     exchange_response = client.item_public_token_exchange(exchange_request)
    #     access_token = exchange_response['access_token']
    #     item_id = exchange_response['item_id']
    #     return jsonify(exchange_response.to_dict())
    # except plaid.ApiException as e:
    #     return json.loads(e.body)
    public_token = request.json['public_token']
    try:
        exchange_request = ItemPublicTokenExchangeRequest(
            public_token=public_token)
        exchange_response = client.item_public_token_exchange(exchange_request)
        return jsonify(exchange_response.to_dict())
    except ApiException as e:
        return jsonify({"error": str(e)}), 400


@app.route('/investments/holdings/get', methods=['POST'])
def get_holdings():
    data = request.get_json()
    access_token = data['access_token']
    
    try:
        holdings_request = InvestmentsHoldingsGetRequest(access_token=access_token)
        holdings_response = client.investments_holdings_get(holdings_request)
        holdings = holdings_response['holdings']
        securities = holdings_response['securities']
        
        return jsonify({
            'holdings': holdings,
            'securities': securities
        })
    except ApiException as e:
        return jsonify({'error': str(e)}), 400


if __name__ == '__main__':
    app.run(port=3000, debug=True)
