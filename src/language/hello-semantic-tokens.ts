import { AbstractSemanticTokenProvider, AstNode, GrammarAST, SemanticTokenAcceptor, flattenCst, isLeafCstNode } from "langium";
import { SemanticTokenTypes } from "vscode-languageserver";

export class HelloSemanticTokenProvider extends AbstractSemanticTokenProvider {
    protected override highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor): void | "prune" | undefined {
        console.log("mimimimi3")
        if (node.$cstNode !== undefined && node.$container === undefined) {
            flattenCst(node.$cstNode).forEach ((cst) =>{
                
                if (GrammarAST.isKeyword(cst.grammarSource) && "person" !== (cst.grammarSource as GrammarAST.Keyword).value) {
                    console.log("HelloSemanticTokenProvider", cst.tokenType.name)
                    acceptor({
                        node: cst.astNode,
                        keyword: (cst.grammarSource as GrammarAST.Keyword).value,
                        type: SemanticTokenTypes.keyword
                    })
                } else if (isLeafCstNode(cst) && "ML_COMMENT" == cst.tokenType.name) {
                    // console.log("HelloSemanticTokenProvider", cst.tokenType.name)
                    // console.log("comment found");
                    // acceptor({
                    //     cst: cst,
                    //     type: SemanticTokenTypes.comment
                    // })
                }
            })
        }
        
    }

}