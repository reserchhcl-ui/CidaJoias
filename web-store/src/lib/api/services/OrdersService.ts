/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckoutRequest } from '../models/CheckoutRequest';
import type { OrderCreate } from '../models/OrderCreate';
import type { OrderResponse } from '../models/OrderResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OrdersService {
    /**
     * Create New Order
     * Cria uma nova encomenda para o utilizador atualmente autenticado.
     * @param requestBody
     * @returns OrderResponse Successful Response
     * @throws ApiError
     */
    public static createNewOrderApiV1OrdersPost(
        requestBody: OrderCreate,
    ): CancelablePromise<OrderResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/orders/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read My Orders
     * Obtém o histórico de pedidos para o cliente atualmente autenticado.
     * @param skip
     * @param limit
     * @returns OrderResponse Successful Response
     * @throws ApiError
     */
    public static readMyOrdersApiV1OrdersMeusPedidosGet(
        skip?: number,
        limit: number = 25,
    ): CancelablePromise<Array<OrderResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/orders/meus-pedidos',
            query: {
                'skip': skip,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Public Checkout
     * @param requestBody
     * @returns OrderResponse Successful Response
     * @throws ApiError
     */
    public static publicCheckoutApiV1OrdersPedidosPost(
        requestBody: CheckoutRequest,
    ): CancelablePromise<OrderResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/orders/pedidos',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
