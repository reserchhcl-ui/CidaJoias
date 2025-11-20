/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Product } from '../models/Product';
import type { ProductCreate } from '../models/ProductCreate';
import type { ProductUpdate } from '../models/ProductUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProductsService {
    /**
     * Read Products
     * @param skip
     * @param limit
     * @returns Product Successful Response
     * @throws ApiError
     */
    public static readProducts(
        skip?: number,
        limit: number = 100,
    ): CancelablePromise<Array<Product>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/products/',
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
     * Create Product Endpoint
     * @param requestBody
     * @returns Product Successful Response
     * @throws ApiError
     */
    public static createProduct(
        requestBody: ProductCreate,
    ): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/products/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read Product
     * @param productId
     * @returns Product Successful Response
     * @throws ApiError
     */
    public static readProduct(
        productId: number,
    ): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/products/{product_id}',
            path: {
                'product_id': productId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Product Endpoint
     * @param productId
     * @param requestBody
     * @returns Product Successful Response
     * @throws ApiError
     */
    public static updateProduct(
        productId: number,
        requestBody: ProductUpdate,
    ): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/products/{product_id}',
            path: {
                'product_id': productId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Product Endpoint
     * @param productId
     * @returns void
     * @throws ApiError
     */
    public static deleteProduct(
        productId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/products/{product_id}',
            path: {
                'product_id': productId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read Product By Barcode
     * @param barcode
     * @returns Product Successful Response
     * @throws ApiError
     */
    public static readProductByBarcode(
        barcode: string,
    ): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/products/barcode/{barcode}',
            path: {
                'barcode': barcode,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
