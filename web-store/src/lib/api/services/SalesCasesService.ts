/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SalesCaseCreate } from '../models/SalesCaseCreate';
import type { SalesCaseResponse } from '../models/SalesCaseResponse';
import type { SalesCaseReturnReport } from '../models/SalesCaseReturnReport';
import type { SalesCaseReturnRequest } from '../models/SalesCaseReturnRequest';
import type { SalesCaseStatus } from '../models/SalesCaseStatus';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SalesCasesService {
    /**
     * Create New Sales Case
     * @param requestBody
     * @returns SalesCaseResponse Successful Response
     * @throws ApiError
     */
    public static createNewSalesCaseApiV1SalesCasesPost(
        requestBody: SalesCaseCreate,
    ): CancelablePromise<SalesCaseResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/sales-cases/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read Sales Cases
     * @param status
     * @param salesRepId
     * @returns SalesCaseResponse Successful Response
     * @throws ApiError
     */
    public static readSalesCasesApiV1SalesCasesGet(
        status?: (SalesCaseStatus | null),
        salesRepId?: (number | null),
    ): CancelablePromise<Array<SalesCaseResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sales-cases/',
            query: {
                'status': status,
                'sales_rep_id': salesRepId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Return Sales Case
     * @param caseId
     * @param requestBody
     * @returns SalesCaseReturnReport Successful Response
     * @throws ApiError
     */
    public static returnSalesCaseApiV1SalesCasesCaseIdReturnPost(
        caseId: number,
        requestBody: SalesCaseReturnRequest,
    ): CancelablePromise<SalesCaseReturnReport> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/sales-cases/{case_id}/return',
            path: {
                'case_id': caseId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read Sales Case
     * @param caseId
     * @returns SalesCaseResponse Successful Response
     * @throws ApiError
     */
    public static readSalesCaseApiV1SalesCasesCaseIdGet(
        caseId: number,
    ): CancelablePromise<SalesCaseResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sales-cases/{case_id}',
            path: {
                'case_id': caseId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
