import scrape from 'website-scraper';
import puppeteer from 'puppeteer';
import cheerio from 'cheerio';
import fs from 'fs';

const url = 'https://bepage.vn/kho-giao-dien';
import request from 'request-promise';

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function links(url) {

    return new Promise(resolve => {

        request(url, (error, response, html) => {
            if (!error && response.statusCode == 200) {
                const $ = cheerio.load(html); // load HTML

                var obj = [];
                let x = 0;
                $("body").find("a").each((index, el) => { // lặp từng phần tử có class là job__list-item


                    let link = $(el).attr('href');

                    if (link.indexOf("mail:") === 0 || link.indexOf("tel:") === 0 || link.indexOf("#") === 0) {

                    } else {

                        if (link.indexOf("http") === -1) {
                            link = url + "/" + link;
                        }
                        //  link=link.replace("\/\/","\/");

                        if (link.indexOf(url) !== -1)
                            obj.push(link);


                    }


                })

                resolve(obj);
            } else {
                console.error(error.message);
                resolve(error.message)
            }
        });
    });


}

async function locdulieu(url, xclass, child) {

    return new Promise(resolve => {

        request(url, (error, response, html) => {
            if (!error && response.statusCode == 200) {
                const $ = cheerio.load(html); // load HTML
                var temp ={};
                var obj = [];
                let x = 0;
                $(xclass).each((index, el) => { // lặp từng phần tử có class là job__list-item
                    var job = {}; // lấy tên job, được nằm trong thẻ a < .job__list-item-title

                    x++;

                    var ob = {};

                    let array = [];
               
                    for (let i = 0; i < child.length; i++) {

                        var ob = child[i].split(":");

                        job = $(el).find(ob[0]);

                        if (ob[1] === 'text') {
                            temp.text = job.text();
                        } else if (ob[1] === 'href') {

                            temp.href = job.attr('href');

                        } else if (ob[1] === 'src') {

                            temp.src = job.attr('src');

                        }

                    }
                    //  array.push(temp);


                   // obj.push(temp);


                })

                temp.title = $('head > title').text();
                temp.keywords = $('head > meta[name="keywords"]').attr('content');
                temp.description = $('head > meta[name="description"]').attr('content');
                temp.h1 = $('h1').html();
                temp.h2 = $('h2').html();
                temp.h3 = $('h3').html();
                temp.h4 = $('h4').html();
                temp.h5 = $('h5').html();
                temp.h6 = $('h6').html();
                obj.push(temp);
                resolve(obj);
            } else {
                console.error(error.message);
                resolve(error.message)
            }
        });
    });


}


async function chupmanhinh(web, w, h) {
    /*    const browser = await puppeteer.launch({args: ["--no-sandbox", "--disable-setuid-sandbox"]});   */
    const width = w;
    const height = h;
    const browser = await puppeteer.launch({
        args: [
            `--window-size=${width},${height}`
        ],
        defaultViewport: {
            width,
            height
        }
    });
    const page = await browser.newPage();
    await page.goto(web);
    await page.waitForTimeout(10000);


    // await page.setViewport({width: w, height: h}); // This is ignored
    // await page.screenshot({path: `screen.png`,fullPage: true });
    await page.screenshot({path: web.split(`://`)[1] + `screen.png`});
    await page.close();
    await browser.close();
}

// upload san pham

async function postfile() {

    var options = {
        method: 'POST',
        uri: 'https://apps.stv.vn/files',
        formData: {
            file: {
                value: fs.createReadStream('./screen.png'),
                options: {
                    filename: 'screen.png',
                    contentType: 'image/png'
                }
            }
        },
        headers: {
            /* 'content-type': 'multipart/form-data' */ // Is set automatically
            "Authorization": "Bearer KnowdaMGwsCMhVbnhCU6x_x0aY8721cS",
        },
        json: true
    };

    const body = await request(options)

        .catch(function (err) {
            console.error(err.message);
        });

    console.log(body.data.id);
    return body.data.id;
};

async function postitem(item, data) {


    var options = {
        method: 'POST',
        uri: '  https://apps.stv.vn/items/' + item,
        body: data,
        headers: {
            /* 'content-type': 'multipart/form-data' */ // Is set automatically
            "Authorization": "Bearer KnowdaMGwsCMhVbnhCU6x_x0aY8721cS",
        },
        json: true // Automatically stringifies the body to JSON
    };
    const parsedBody = await request(options)

        .catch(function (err) {
            console.error(err.message);
        });

    return parsedBody;
}


// lưu toàn bộ trang web
async function save(urls, name) {

    if (!fs.existsSync('./' + name)) {
        scrape({
            urls: urls,
            directory: './' + name,
            request: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 4 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19'
                }
            }
        });
    }

}


async function api(item) {


    var options = {
        method: 'GET',
        uri: '  https://apps.stv.vn/items/' + item,
        headers: {
            /* 'content-type': 'multipart/form-data' */ // Is set automatically
            "Authorization": "Bearer KnowdaMGwsCMhVbnhCU6x_x0aY8721cS",
        },
        json: true // Automatically stringifies the body to JSON
    };
    const parsedBody = await request(options)

        .catch(function (err) {
            console.error(err.message);
        });

    return parsedBody;
}


async function getapi(url = "") {


    let items = await api('webcopy');

    let item = items.data[0];

    if (url === "") url = item.url;
    let array = await locdulieu(url, item.class, item.extract);

    console.log(array);
    if (item.screenshot) {
        await chupmanhinh(url, 720, 920);
    }
    if (item.webzip) {

        await save([item.url], url.split(`://`)[1]);
    }
    console.log(item);


    if (item.postapi !== '') {

        let headers = item.headers;
        var options = {
            method: 'POST',
            uri: item.postapi,
            headers,
            json: true // Automatically stringifies the body to JSON
        };
        const api = await request(options)

            .catch(function (err) {
                console.error(err.message);
            });

        console.log(api);


    }


    if (item.suburl) {

        let sublink = await links(item.url);
        //console.log(sublink);
        for (let x = 0; x < sublink.length; x++) {

            await getapi(sublink[x]);
            await delay(5000);
        }
    }

    //  setTimeout(getapi, 15000);
}

getapi();
/*

(async () => {


    let array = [];
    for (let x = 1; x <= 11; x++) {
        let url = 'https://zozo.vn/kho-giao-dien?page=' + x;

        let array2 = await locdulieu(url, '.themes-item', ['a:href', 'img:src', 'a:text']);

        array = array.concat(array2)

        //console.log(array);
    }
    /!*    let url = 'https://zozo.vn/kho-giao-dien?page=1';

        let array = await locdulieu(url, '.themes-item', ['a:href', 'img:src', 'a:text']);*!/


    array.forEach(async function (item) {


        let url = item.href.replace('giao-dien\/', 'giao-dien\/demo\/');
        let name = url.split('/');

        name = name[name.length - 1];

        url = "https://" + name + ".exdomain.net";
        await save([url], name);

        let img = 'https://zozo.vn' + item.src

        console.log(url + ' \n  ' + img + ' \n' + name);

    });
    /!*    for (let i = 2; i <= 48; i++) {
            url = 'http://demo.stv.vn/mau/' + i;

            // await chupmanhinh(url, 720, 920);


            /!*        const fileid = await postfile();


                    let post = {

                        title: 'Mẫu Ladingpage',
                        category_id: 5,
                        price: 2000000,
                        preview_url: url,
                        image: fileid
                    };
                    let res = await postitem("demo", post);

                    console.log(res);
                    await delay(15000);*!/
        }*!/

    // upload san pham
    // await  save([url]);

})();

*/
