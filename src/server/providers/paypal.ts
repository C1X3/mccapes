import axios from 'axios';
import { CheckoutPayload } from './types';

async function getAccessToken(): Promise<string> {
    try {
        const response = await axios.post(`${process.env.PAYPAL_API_URL}/v1/oauth2/token`, {
            auth: {
                username: process.env.PAYPAL_CLIENT_ID,
                password: process.env.PAYPAL_SECRET_KEY,
            },
            data: 'grant_type=client_credentials',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });

        return response.data.access_token;
    } catch (error) {
        console.error('PayPal auth error:', error);
        throw new Error('Failed to authenticate with PayPal');
    }
}

export async function createCheckoutSession(payload: CheckoutPayload): Promise<string> {
    try {
        const accessToken = await getAccessToken();

        const response = await axios.post(`${process.env.PAYPAL_API_URL}/v2/checkout/orders`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            data: {
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        amount: {
                            currency_code: 'USD',
                            value: payload.totalPrice.toFixed(2),
                            breakdown: {
                                item_total: {
                                    currency_code: 'USD',
                                    value: payload.totalPrice.toFixed(2),
                                },
                            },
                        },
                        items: payload.items.map(item => ({
                            name: item.name,
                            quantity: item.quantity.toString(),
                            unit_amount: {
                                currency_code: 'USD',
                                value: item.price.toFixed(2),
                            },
                        })),
                        custom_id: payload.orderId,
                    },
                ],
                application_context: {
                    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/${payload.orderId}?success=true`,
                    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/${payload.orderId}?canceled=true`,
                    brand_name: 'MCCapes Store',
                    user_action: 'PAY_NOW',
                },
            },
        });

        // Find the approval URL from the response links
        const approvalUrl = response.data.links.find(
            (link: { rel: string }) => link.rel === 'approve'
        ).href;

        return approvalUrl;
    } catch (error) {
        console.error('PayPal checkout error:', error);
        throw new Error('Failed to create PayPal checkout session');
    }
}
