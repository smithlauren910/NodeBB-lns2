"use strict"; // consulted https://stackoverflow.com/questions/31391760/use-strict-needed-in-a-typescript-file

import * as qs from 'querystring';
import * as _ from 'lodash'; // referenced https://github.com/DefinitelyTyped/DefinitelyTyped/issues/7903

interface pagination {
    create(currentPage:number, pageCount:number, queryObj:Record<string, any>): Data
}

const pagination:pagination = module.exports;

interface Data { // referenced https://blog.logrocket.com/types-vs-interfaces-typescript/
    prev: Item,
    next: Item,
    first: Item,
    last: Item,
    rel: any[],
    pages: any[],
    currentPage: number,
    pageCount: number,
}

interface Item {
    page:number,
    active:boolean,
}

pagination.create = function (currentPage:number, pageCount:number, queryObj:any): Data {
    if (pageCount <= 1) {
        return {
            prev: { page: 1, active: currentPage > 1 },
            next: { page: 1, active: currentPage < pageCount },
            first: { page: 1, active: currentPage === 1 },
            last: { page: 1, active: currentPage === pageCount },
            rel: [],
            pages: [],
            currentPage: 1,
            pageCount: 1,
        };
    }
    pageCount = parseInt((pageCount).toString(), 10);
    const pagesToShow:number[] = [1, 2, pageCount - 1, pageCount];

    currentPage = parseInt((currentPage).toString(), 10) || 1;
    const previous = Math.max(1, currentPage - 1);
    const next = Math.min(pageCount, currentPage + 1);

    let startPage:number = Math.max(1, currentPage - 2);
    if (startPage > pageCount - 5) {
        startPage -= 2 - (pageCount - currentPage);
    }
    let i:number;
    for (i = 0; i < 5; i += 1) {
        pagesToShow.push(startPage + i);
    }

    const pagesFiltered:number[] = _.uniq(pagesToShow).filter((page:number) => page > 0 && page <= pageCount).sort((a:number, b:number) => a - b);

    queryObj = { ...(queryObj || {}) };

    delete queryObj._;

    const pages:any[] = pagesFiltered.map((page:number) => {
        queryObj.page = page;
        return { page: page, active: page === currentPage, qs: qs.stringify(queryObj) };
    });

    for (i = pages.length - 1; i > 0; i -= 1) {
        if (pages[i].page - 2 === pages[i - 1].page) {
            pages.splice(i, 0, { page: pages[i].page - 1, active: false, qs: qs.stringify(queryObj) });
        } else if (pages[i].page - 1 !== pages[i - 1].page) {
            pages.splice(i, 0, { separator: true });
        }
    }

    const data = {
        rel: [],
        pages: pages,
        currentPage: currentPage,
        pageCount: pageCount,
        prev: { page: 0, active: false, qs: '' },
        next: { page: 0, active: false, qs: '' },
        first: { page: 0, active: false, qs: '' },
        last: { page: 0, active: false, qs: '' },
    };

    queryObj.page = previous;
    data.prev = { page: previous, active: currentPage > 1, qs: qs.stringify(queryObj) };
    queryObj.page = next;
    data.next = { page: next, active: currentPage < pageCount, qs: qs.stringify(queryObj) };

    queryObj.page = 1;
    data.first = { page: 1, active: currentPage === 1, qs: qs.stringify(queryObj) };
    queryObj.page = pageCount;
    data.last = { page: pageCount, active: currentPage === pageCount, qs: qs.stringify(queryObj) };

    if (currentPage < pageCount) {
        data.rel.push({
            rel: 'next',
            href: `?${qs.stringify({ ...queryObj, page: next })}`,
        });
    }

    if (currentPage > 1) {
        data.rel.push({
            rel: 'prev',
            href: `?${qs.stringify({ ...queryObj, page: previous })}`,
        });
    }
    return data;
};
