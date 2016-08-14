
module.exports = function(){
    var greet = document.createElement('div');
    var html = `
    <div>
        <h1>Hello World!</h1>
    </div>
    `;
    greet.insertAdjacentHTML("BeforeEnd",html);
    return greet;  
}