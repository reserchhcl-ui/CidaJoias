/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Discount } from '../models/Discount';
import type { DiscountCreate } from '../models/DiscountCreate';
import type { DiscountUpdate } from '../models/DiscountUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DiscountsAdminService {
    /**
     * Create Discount
     * @param requestBody
     * @returns Discount Successful Response
     * @throws ApiError
     */
    public static createDiscountApiV1DiscountsPost(
        requestBody: DiscountCreate,
    ): CancelablePromise<Discount> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/discounts/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read Discounts
     * @param skip
     * @param limit
     * @returns Discount Successful Response
     * @throws ApiError
     */
    public static readDiscountsApiV1DiscountsGet(
        skip?: number,
        limit: number = 100,
    ): CancelablePromise<Array<Discount>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/discounts/',
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
     * Read Discount
     * @param discountId
     * @returns Discount Successful Response
     * @throws ApiError
     */
    public static readDiscountApiV1DiscountsDiscountIdGet(
        discountId: number,
    ): CancelablePromise<Discount> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/discounts/{discount_id}',
            path: {
                'discount_id': discountId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Discount
     * @param discountId
     * @param requestBody
     * @returns Discount Successful Response
     * @throws ApiError
     */
    public static updateDiscountApiV1DiscountsDiscountIdPut(
        discountId: number,
        requestBody: DiscountUpdate,
    ): CancelablePromise<Discount> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/discounts/{discount_id}',
            path: {
                'discount_id': discountId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Discount
     * @param discountId
     * @returns void
     * @throws ApiError
     */
    public static deleteDiscountApiV1DiscountsDiscountIdDelete(
        discountId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/discounts/{discount_id}',
            path: {
                'discount_id': discountId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
