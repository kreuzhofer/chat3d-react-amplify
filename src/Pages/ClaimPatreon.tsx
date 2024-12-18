function ClaimPatreon()
{
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    if(codeParam)
    {
        console.log("codeParam: "+codeParam);
    }

    return (
        <div>
            <h1>Claim Patreon</h1>
        </div>
    );
}

export default ClaimPatreon;