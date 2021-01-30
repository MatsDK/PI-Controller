const test = async () => {
     let x = ""
     while(x.length < 25) {
          x+="S"
          console.log(x.length, x)
          await sleep(10)
     }

};



const sleep = (ms) => {
     return new Promise((resolve) => setTimeout(resolve, ms));
};

test();


