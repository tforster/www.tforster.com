/* global describe test beforeEach expect */
const Contentful = require('../src/js/contentful.js');


const config = {
  accessToken: 'ebfa99618c6da4ae410dd709ec1b7b9c515cbf0cae711b3f78cb67dbea029b61',
  space: 'xyov37w0wvhz'
}


/**
 * Mocked fetch() responses. Do not confuse with responses from Contentful client which manipulate these
 */
const mockEntry = {
  "sys": {
    "type": "Array"
  },
  "total": 1,
  "skip": 0,
  "limit": 100,
  "items": [
    {
      "sys": {
        "space": {
          "sys": {
            "type": "Link",
            "linkType": "Space",
            "id": "xyov37w0wvhz"
          }
        },
        "id": "1FP7SkckT6g22ISSwMAksy",
        "type": "Entry",
        "createdAt": "2017-06-06T15:11:38.541Z",
        "updatedAt": "2017-06-09T14:31:36.133Z",
        "revision": 4,
        "contentType": {
          "sys": {
            "type": "Link",
            "linkType": "ContentType",
            "id": "product"
          }
        },
        "locale": "en-CA"
      },
      "fields": {
        "title": "www.tforster.com (This website)",
        "teaser": "This latest iteration of my website is utilizes serverless technology, the JAM stack and CaaS",
        "description": "My own website has always been an experimental testbed and is my guinea pig for trying out new technologies. In the late 90's it comprised a handful of .HTML pages on an Interlog server followed by ASP.Classic and ASP.Net 1.1 running DotNetNuke on GoDaddy in 2010, Wordpress on wordpress.org (very brief), return to ASP.NET in 2011, and NodeJS/ExpressJS/MongoDB on Digital Ocean in 20\n\n* 1998 Static pages on Interlog\n* 2006 Wordpress\n* 2010 ASP.NET\n* 2013 Express\n* 2017 Serverless\n\n#### The Solution\n",
        "employer": {
          "sys": {
            "type": "Link",
            "linkType": "Entry",
            "id": "3O7zkVboViOQWcUQ6uO2KO"
          }
        },
        "company": {
          "sys": {
            "type": "Link",
            "linkType": "Entry",
            "id": "Qut6zaMUcSQSKW8iUOEk6"
          }
        },
        "yearCreated": 1997,
        "liveUrl": "https://www.tforster.com",
        "gitHubUrl": "https://github.com/tforster/tforster.com",
        "thumbnailUrl": "https://images.contentful.com/xyov37w0wvhz/28O090mt7uCU64WYKCWAKI/a65e320c76e6db9a000ab30bdd8c25fe/www.tforster.com.jpg",
        "tags": [
          "serverless",
          "jam",
          "caas",
          "s3",
          "cloudfront",
          "contentful",
          "es6",
          "http2"
        ],
        "slug": "www-tforster-com-this-website"
      }
    }
  ],
  "includes": {
    "Entry": [
      {
        "sys": {
          "space": {
            "sys": {
              "type": "Link",
              "linkType": "Space",
              "id": "xyov37w0wvhz"
            }
          },
          "id": "3O7zkVboViOQWcUQ6uO2KO",
          "type": "Entry",
          "createdAt": "2017-05-07T00:08:03.348Z",
          "updatedAt": "2017-05-07T00:08:03.348Z",
          "revision": 1,
          "contentType": {
            "sys": {
              "type": "Link",
              "linkType": "ContentType",
              "id": "employer"
            }
          },
          "locale": "en-CA"
        },
        "fields": {
          "company": "Troy Forster",
          "title": "Founder",
          "companyUrl": "http://www.tforster.com",
          "yearFrom": 1985,
          "yearTo": 2017
        }
      },
      {
        "sys": {
          "space": {
            "sys": {
              "type": "Link",
              "linkType": "Space",
              "id": "xyov37w0wvhz"
            }
          },
          "id": "Qut6zaMUcSQSKW8iUOEk6",
          "type": "Entry",
          "createdAt": "2017-05-07T00:02:54.711Z",
          "updatedAt": "2017-06-06T14:59:13.433Z",
          "revision": 3,
          "contentType": {
            "sys": {
              "type": "Link",
              "linkType": "ContentType",
              "id": "company"
            }
          },
          "locale": "en-CA"
        },
        "fields": {
          "name": "Troy Forster",
          "url": "https://www.tforster.com",
          "logoUrl": "https://images.contentful.com/xyov37w0wvhz/5h6eRrGQ8w2aea6KUe2oWm/85d131bad4250e3ec72ba55c562fbc9a/side-face.jpg"
        }
      }
    ]
  }
}

const mockEntries = {
  "sys": {
    "type": "Array"
  },
  "total": 4,
  "skip": 0,
  "limit": 100,
  "items": [
    {
      "sys": {
        "space": {
          "sys": {
            "type": "Link",
            "linkType": "Space",
            "id": "xyov37w0wvhz"
          }
        },
        "id": "3nwXpHb4YoaeigS06Iuyem",
        "type": "Entry",
        "createdAt": "2017-05-07T00:12:56.060Z",
        "updatedAt": "2017-06-05T19:24:53.051Z",
        "revision": 3,
        "contentType": {
          "sys": {
            "type": "Link",
            "linkType": "ContentType",
            "id": "product"
          }
        },
        "locale": "en-CA"
      },
      "fields": {
        "title": "MyGolio Website",
        "teaser": "Consulting",
        "employer": {
          "sys": {
            "type": "Link",
            "linkType": "Entry",
            "id": "3O7zkVboViOQWcUQ6uO2KO"
          }
        },
        "company": {
          "sys": {
            "type": "Link",
            "linkType": "Entry",
            "id": "256dIvtpzKAeK0M28YE80C"
          }
        },
        "yearCreated": 2017,
        "liveUrl": "http://www.mygolio.com/",
        "thumbnailUrl": "https://images.contentful.com/xyov37w0wvhz/3rYDiTiroQsCoEgMwaCOwo/3171de527aaef1b4af338ac4e0b628d6/mygolio-logo.png",
        "slug": "mygolio-website"
      }
    },
    {
      "sys": {
        "space": {
          "sys": {
            "type": "Link",
            "linkType": "Space",
            "id": "xyov37w0wvhz"
          }
        },
        "id": "23NGyDKB6U0qM2gss4c8G8",
        "type": "Entry",
        "createdAt": "2017-05-06T21:57:14.609Z",
        "updatedAt": "2017-06-05T19:28:56.099Z",
        "revision": 5,
        "contentType": {
          "sys": {
            "type": "Link",
            "linkType": "ContentType",
            "id": "product"
          }
        },
        "locale": "en-CA"
      },
      "fields": {
        "title": "Cheese and Co Website",
        "teaser": "Cheese and Co is a fictitious gourmet cheese shop created by St. Joseph Communications to help sell their Brandstem product. This website made extensive use of the Brandstem API as part of the demo.",
        "employer": {
          "sys": {
            "type": "Link",
            "linkType": "Entry",
            "id": "4vZp4VhEpOiaMwY4gOCasK"
          }
        },
        "company": {
          "sys": {
            "type": "Link",
            "linkType": "Entry",
            "id": "6YLpoLtvFYyeS0UaSwYEIE"
          }
        },
        "yearCreated": 2015,
        "liveUrl": "https://www.cheeseand.co/",
        "thumbnailUrl": "https://images.contentful.com/xyov37w0wvhz/6FTXhd6iliyAS0I0y4oE24/0f71413a70c333f5b59b6ee38984e816/cheese-and-co-logo.svg",
        "slug": "cheese-and-co-website"
      }
    },
    {
      "sys": {
        "space": {
          "sys": {
            "type": "Link",
            "linkType": "Space",
            "id": "xyov37w0wvhz"
          }
        },
        "id": "5FzaaR93EIqwKMoS2MAqQ0",
        "type": "Entry",
        "createdAt": "2017-05-17T19:35:14.263Z",
        "updatedAt": "2017-05-17T19:36:20.611Z",
        "revision": 3,
        "contentType": {
          "sys": {
            "type": "Link",
            "linkType": "ContentType",
            "id": "product"
          }
        },
        "locale": "en-CA"
      },
      "fields": {
        "title": "Movember",
        "teaser": "I made a mustache for Movember",
        "employer": {
          "sys": {
            "type": "Link",
            "linkType": "Entry",
            "id": "3O7zkVboViOQWcUQ6uO2KO"
          }
        },
        "thumbnailUrl": "https://scontent.cdninstagram.com/t51.2885-15/e15/11084872_783047981812619_156138269_n.jpg",
        "slug": "movember"
      }
    },
    {
      "sys": {
        "space": {
          "sys": {
            "type": "Link",
            "linkType": "Space",
            "id": "xyov37w0wvhz"
          }
        },
        "id": "510n5L0N6ECMesusuUC2wA",
        "type": "Entry",
        "createdAt": "2017-06-04T22:07:12.004Z",
        "updatedAt": "2017-06-04T22:07:12.004Z",
        "revision": 1,
        "contentType": {
          "sys": {
            "type": "Link",
            "linkType": "ContentType",
            "id": "product"
          }
        },
        "locale": "en-CA"
      },
      "fields": {
        "title": "Hacking a Parrot AR Drone",
        "description": "https://scontent.cdninstagram.com/t50.2886-16/10568295_1443692935906196_11923714_n.mp4",
        "employer": {
          "sys": {
            "type": "Link",
            "linkType": "Entry",
            "id": "3O7zkVboViOQWcUQ6uO2KO"
          }
        },
        "thumbnailUrl": "https://scontent.cdninstagram.com/t51.2885-15/e15/10518018_752489371458914_1095899106_n.jpg",
        "slug": "hacking-a-parrot-ar-drone"
      }
    },
  ]
}

describe("Contentful client suite", () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  let contentful = new Contentful(config);

  test('Client constructor Should return an object', () => {
    expect(typeof (contentful)).toBe('object');
  })

  test('getEntries should have specific root properties', () => {
    fetch.mockResponse(JSON.stringify(mockEntries));
    const query = {};

    return contentful.getEntries('textBlock', query, 2)
      .then(data => {
        expect(data).toEqual(expect.objectContaining({
          sys: expect.objectContaining({
            type: expect.any(String)
          }),
          total: expect.any(Number),
          skip: expect.any(Number),
          limit: expect.any(Number),
          items: expect.arrayContaining
        }));
        
      });
  });

  test('getEntry should have specific root properties', () => {
    fetch.mockResponse(JSON.stringify(mockEntry));

    const query = { slug: 'www-tforster-com-this-website' };

    return contentful.getEntry('product', query, 10)
      .then(data => {
        expect(data).toEqual(expect.objectContaining({
          sys: expect.objectContaining({
            type: expect.any(String)
          }),
          fields: expect.objectContaining({
            title: expect.any(String),
            teaser: expect.any(String),
            description: expect.any(String),
            employer: expect.objectContaining({
              fields: expect.objectContaining({
                company: expect.any(String)
              })
            })
          })
        }));

        expect(data).not.toEqual(expect.objectContaining({
          items:expect.anything()
        }));

      });
  });

  
  
  // test('getEntry should return a single item array', () => {
  //   fetch.mockResponse(JSON.stringify(mockEntry));
  //   return contentful.getEntry('textBlock', 0, { page: 'uses', id: 'main' })
  //     .then(data => {
  //       expect(data).toEqual(expectedActions)
  //     });
  // });

  // test('Should return denormalized results', () => {
  //   fetch.mockResponse(JSON.stringify(mockEntries));
  //   return contentful.getEntries('textBlock', 0, { page: 'uses', id: 'main' })
  //     .then(data => {
  //       expect(data).toEqual(expectedActions)
  //     });
  // });

  // test('Should return a single entry', () => {
  //   let query = {};
  //   fetch.mockResponse(JSON.stringify(sampleResponse));
  //   const expectedActions = { access_token: '12345' }

  //   return contentful.entries('textBlock', 0, { page: 'uses', id: 'main' })
  //     .then(data => {
  //       expect(data).toEqual(expectedActions)
  //     });
  // })


});


