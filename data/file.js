const test = async () => {
     for (let i = 1; i <= 1000; i++) {
          let out = "";

          if (i % 5 == 0) out += "fizz";
          if (i % 3 == 0) out += "buzz";
          if (i % 5 != 0 && i % 3 != 0) out = i;

          console.log(out);
          await sleep(2);
     }
};

const sleep = (ms) => {
     return new Promise((resolve) => setTimeout(resolve, ms));
};

test();


const te = "ats"

console.log(te)