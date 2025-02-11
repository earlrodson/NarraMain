module.exports = {
    apps: [
        {
        name: "narrafe",
        script: "docker",
        args: "run -d --rm -p 3000:3000 -v $(pwd):/app narrafe"
        }
    ]
};
