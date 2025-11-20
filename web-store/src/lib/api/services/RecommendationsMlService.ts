/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Product } from '../models/Product';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RecommendationsMlService {
    /**
     * Get Personalized Recommendations
     * Retorna uma lista de produtos recomendados para o utilizador logado.
     * @param limit
     * @returns Product Successful Response
     * @throws ApiError
     */
    public static getPersonalizedRecommendationsApiV1RecommendationsGet(
        limit: number = 5,
    ): CancelablePromise<Array<Product>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/recommendations/',
            query: {
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Similar Products
     * Retorna produtos similares (ex: mesmo range de preço).
     * Acesso público (não requer login).
     * @param productId
     * @param limit
     * @returns Product Successful Response
     * @throws ApiError
     */
    public static getSimilarProductsApiV1RecommendationsProductProductIdGet(
        productId: number,
        limit: number = 4,
    ): CancelablePromise<Array<Product>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/recommendations/product/{product_id}',
            path: {
                'product_id': productId,
            },
            query: {
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
